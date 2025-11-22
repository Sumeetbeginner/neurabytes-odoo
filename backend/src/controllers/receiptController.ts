import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateReference } from '../utils/helpers';

export const getReceipts = async (req: AuthRequest, res: Response) => {
  try {
    const { status, locationId } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (locationId) {
      where.locationId = locationId as string;
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        location: {
          include: { warehouse: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
        lines: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ receipts });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ error: 'Failed to get receipts' });
  }
};

export const getReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        location: {
          include: { warehouse: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
        lines: {
          include: { product: true },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json({ receipt });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Failed to get receipt' });
  }
};

export const createReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierName, locationId, scheduledDate, notes, lines } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const reference = generateReference('RCP');

    const receipt = await prisma.receipt.create({
      data: {
        reference,
        supplierName,
        locationId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        userId: req.user.id,
        status: 'DRAFT',
        lines: {
          create: lines.map((line: any) => ({
            productId: line.productId,
            quantity: line.quantity,
            receivedQty: 0,
          })),
        },
      },
      include: {
        location: {
          include: { warehouse: true },
        },
        lines: {
          include: { product: true },
        },
      },
    });

    res.status(201).json({
      message: 'Receipt created successfully',
      receipt,
    });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ error: 'Failed to create receipt' });
  }
};

export const validateReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        lines: true,
        location: true,
      },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (receipt.status === 'DONE') {
      return res.status(400).json({ error: 'Receipt already validated' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update receipt status
      const updatedReceipt = await tx.receipt.update({
        where: { id },
        data: {
          status: 'DONE',
          validatedDate: new Date(),
        },
        include: {
          lines: {
            include: { product: true },
          },
          location: {
            include: { warehouse: true },
          },
        },
      });

      // Update stock levels and create stock moves
      for (const line of receipt.lines) {
        // Update or create stock
        const existingStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: receipt.locationId,
            },
          },
        });

        if (existingStock) {
          await tx.stock.update({
            where: { id: existingStock.id },
            data: {
              quantity: { increment: line.quantity },
              available: { increment: line.quantity },
            },
          });
        } else {
          await tx.stock.create({
            data: {
              productId: line.productId,
              locationId: receipt.locationId,
              quantity: line.quantity,
              available: line.quantity,
              reserved: 0,
            },
          });
        }

        // Create stock move
        await tx.stockMove.create({
          data: {
            reference: receipt.reference,
            productId: line.productId,
            toLocationId: receipt.locationId,
            quantity: line.quantity,
            moveType: 'RECEIPT',
            status: 'DONE',
            userId: req.user!.id,
            receiptId: receipt.id,
          },
        });
      }

      return updatedReceipt;
    });

    res.json({
      message: 'Receipt validated successfully',
      receipt: result,
    });
  } catch (error) {
    console.error('Validate receipt error:', error);
    res.status(500).json({ error: 'Failed to validate receipt' });
  }
};

export const cancelReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (receipt.status === 'DONE') {
      return res.status(400).json({ error: 'Cannot cancel validated receipt' });
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });

    res.json({
      message: 'Receipt cancelled successfully',
      receipt: updatedReceipt,
    });
  } catch (error) {
    console.error('Cancel receipt error:', error);
    res.status(500).json({ error: 'Failed to cancel receipt' });
  }
};

