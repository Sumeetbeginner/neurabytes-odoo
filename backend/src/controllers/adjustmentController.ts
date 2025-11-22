import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateReference } from '../utils/helpers';

export const getAdjustments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, locationId } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (locationId) {
      where.locationId = locationId as string;
    }

    const adjustments = await prisma.stockAdjustment.findMany({
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

    res.json({ adjustments });
  } catch (error) {
    console.error('Get adjustments error:', error);
    res.status(500).json({ error: 'Failed to get adjustments' });
  }
};

export const getAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const adjustment = await prisma.stockAdjustment.findUnique({
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

    if (!adjustment) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }

    res.json({ adjustment });
  } catch (error) {
    console.error('Get adjustment error:', error);
    res.status(500).json({ error: 'Failed to get adjustment' });
  }
};

export const createAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, reason, lines } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const reference = generateReference('ADJ');

    // Get current stock levels and calculate differences
    const adjustmentLines = [];
    for (const line of lines) {
      const stock = await prisma.stock.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId,
          },
        },
      });

      const systemQty = stock?.quantity || 0;
      const countedQty = line.countedQty;
      const difference = countedQty - systemQty;

      adjustmentLines.push({
        productId: line.productId,
        systemQty,
        countedQty,
        difference,
      });
    }

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        reference,
        locationId,
        reason,
        userId: req.user.id,
        status: 'DRAFT',
        lines: {
          create: adjustmentLines,
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
      message: 'Adjustment created successfully',
      adjustment,
    });
  } catch (error) {
    console.error('Create adjustment error:', error);
    res.status(500).json({ error: 'Failed to create adjustment' });
  }
};

export const validateAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: {
        lines: true,
      },
    });

    if (!adjustment) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }

    if (adjustment.status === 'DONE') {
      return res.status(400).json({ error: 'Adjustment already validated' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update adjustment status
      const updatedAdjustment = await tx.stockAdjustment.update({
        where: { id },
        data: {
          status: 'DONE',
          adjustmentDate: new Date(),
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

      // Update stock levels and create stock moves
      for (const line of adjustment.lines) {
        if (line.difference === 0) continue;

        // Update or create stock
        const existingStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: adjustment.locationId,
            },
          },
        });

        if (existingStock) {
          await tx.stock.update({
            where: { id: existingStock.id },
            data: {
              quantity: line.countedQty,
              available: line.countedQty - existingStock.reserved,
            },
          });
        } else {
          await tx.stock.create({
            data: {
              productId: line.productId,
              locationId: adjustment.locationId,
              quantity: line.countedQty,
              available: line.countedQty,
              reserved: 0,
            },
          });
        }

        // Create stock move
        await tx.stockMove.create({
          data: {
            reference: adjustment.reference,
            productId: line.productId,
            fromLocationId: line.difference < 0 ? adjustment.locationId : null,
            toLocationId: line.difference > 0 ? adjustment.locationId : null,
            quantity: Math.abs(line.difference),
            moveType: 'ADJUSTMENT',
            status: 'DONE',
            userId: req.user!.id,
            adjustmentId: adjustment.id,
          },
        });
      }

      return updatedAdjustment;
    });

    res.json({
      message: 'Adjustment validated successfully',
      adjustment: result,
    });
  } catch (error) {
    console.error('Validate adjustment error:', error);
    res.status(500).json({ error: 'Failed to validate adjustment' });
  }
};

export const cancelAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id },
    });

    if (!adjustment) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }

    if (adjustment.status === 'DONE') {
      return res.status(400).json({ error: 'Cannot cancel validated adjustment' });
    }

    const updatedAdjustment = await prisma.stockAdjustment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });

    res.json({
      message: 'Adjustment cancelled successfully',
      adjustment: updatedAdjustment,
    });
  } catch (error) {
    console.error('Cancel adjustment error:', error);
    res.status(500).json({ error: 'Failed to cancel adjustment' });
  }
};

export const getStockMoves = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, locationId, moveType, startDate, endDate } = req.query;

    const where: any = {};

    if (productId) {
      where.productId = productId as string;
    }

    if (locationId) {
      where.OR = [
        { fromLocationId: locationId as string },
        { toLocationId: locationId as string },
      ];
    }

    if (moveType) {
      where.moveType = moveType as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const moves = await prisma.stockMove.findMany({
      where,
      include: {
        product: true,
        fromLocation: {
          include: { warehouse: true },
        },
        toLocation: {
          include: { warehouse: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 moves
    });

    res.json({ moves });
  } catch (error) {
    console.error('Get stock moves error:', error);
    res.status(500).json({ error: 'Failed to get stock moves' });
  }
};

