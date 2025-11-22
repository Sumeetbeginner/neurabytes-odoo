import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateReference } from '../utils/helpers';

export const getTransfers = async (req: AuthRequest, res: Response) => {
  try {
    const { status, fromLocationId, toLocationId } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (fromLocationId) {
      where.fromLocationId = fromLocationId as string;
    }
    if (toLocationId) {
      where.toLocationId = toLocationId as string;
    }

    const transfers = await prisma.internalTransfer.findMany({
      where,
      include: {
        fromLocation: {
          include: { warehouse: true },
        },
        toLocation: {
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

    res.json({ transfers });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to get transfers' });
  }
};

export const getTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transfer = await prisma.internalTransfer.findUnique({
      where: { id },
      include: {
        fromLocation: {
          include: { warehouse: true },
        },
        toLocation: {
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

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    res.json({ transfer });
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({ error: 'Failed to get transfer' });
  }
};

export const createTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { fromLocationId, toLocationId, scheduledDate, notes, lines } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (fromLocationId === toLocationId) {
      return res.status(400).json({ error: 'Source and destination cannot be the same' });
    }

    const reference = generateReference('TRF');

    // Check stock availability
    for (const line of lines) {
      const stock = await prisma.stock.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId: fromLocationId,
          },
        },
      });

      if (!stock || stock.available < line.quantity) {
        const product = await prisma.product.findUnique({
          where: { id: line.productId },
        });
        return res.status(400).json({
          error: `Insufficient stock for product: ${product?.name || 'Unknown'}`,
        });
      }
    }

    const transfer = await prisma.internalTransfer.create({
      data: {
        reference,
        fromLocationId,
        toLocationId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        userId: req.user.id,
        status: 'DRAFT',
        lines: {
          create: lines.map((line: any) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        },
      },
      include: {
        fromLocation: {
          include: { warehouse: true },
        },
        toLocation: {
          include: { warehouse: true },
        },
        lines: {
          include: { product: true },
        },
      },
    });

    res.status(201).json({
      message: 'Transfer created successfully',
      transfer,
    });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
};

export const validateTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const transfer = await prisma.internalTransfer.findUnique({
      where: { id },
      include: {
        lines: true,
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.status === 'DONE') {
      return res.status(400).json({ error: 'Transfer already validated' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check stock availability again
      for (const line of transfer.lines) {
        const stock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.fromLocationId,
            },
          },
        });

        if (!stock || stock.available < line.quantity) {
          throw new Error(`Insufficient stock for product ID: ${line.productId}`);
        }
      }

      // Update transfer status
      const updatedTransfer = await tx.internalTransfer.update({
        where: { id },
        data: {
          status: 'DONE',
          validatedDate: new Date(),
        },
        include: {
          fromLocation: {
            include: { warehouse: true },
          },
          toLocation: {
            include: { warehouse: true },
          },
          lines: {
            include: { product: true },
          },
        },
      });

      // Update stock levels and create stock moves
      for (const line of transfer.lines) {
        // Decrease from source location
        await tx.stock.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.fromLocationId,
            },
          },
          data: {
            quantity: { decrement: line.quantity },
            available: { decrement: line.quantity },
          },
        });

        // Increase at destination location
        const destinationStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.toLocationId,
            },
          },
        });

        if (destinationStock) {
          await tx.stock.update({
            where: { id: destinationStock.id },
            data: {
              quantity: { increment: line.quantity },
              available: { increment: line.quantity },
            },
          });
        } else {
          await tx.stock.create({
            data: {
              productId: line.productId,
              locationId: transfer.toLocationId,
              quantity: line.quantity,
              available: line.quantity,
              reserved: 0,
            },
          });
        }

        // Create stock move
        await tx.stockMove.create({
          data: {
            reference: transfer.reference,
            productId: line.productId,
            fromLocationId: transfer.fromLocationId,
            toLocationId: transfer.toLocationId,
            quantity: line.quantity,
            moveType: 'TRANSFER',
            status: 'DONE',
            userId: req.user!.id,
            transferId: transfer.id,
          },
        });
      }

      return updatedTransfer;
    });

    res.json({
      message: 'Transfer validated successfully',
      transfer: result,
    });
  } catch (error: any) {
    console.error('Validate transfer error:', error);
    res.status(500).json({ error: error.message || 'Failed to validate transfer' });
  }
};

export const cancelTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transfer = await prisma.internalTransfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.status === 'DONE') {
      return res.status(400).json({ error: 'Cannot cancel validated transfer' });
    }

    const updatedTransfer = await prisma.internalTransfer.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });

    res.json({
      message: 'Transfer cancelled successfully',
      transfer: updatedTransfer,
    });
  } catch (error) {
    console.error('Cancel transfer error:', error);
    res.status(500).json({ error: 'Failed to cancel transfer' });
  }
};

