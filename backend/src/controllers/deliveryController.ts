import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateReference } from '../utils/helpers';

export const getDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const { status, locationId } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (locationId) {
      where.locationId = locationId as string;
    }

    const deliveries = await prisma.delivery.findMany({
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

    res.json({ deliveries });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Failed to get deliveries' });
  }
};

export const getDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({
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

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({ delivery });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ error: 'Failed to get delivery' });
  }
};

export const createDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { customerName, locationId, scheduledDate, notes, lines } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const reference = generateReference('DEL');

    // Check stock availability
    for (const line of lines) {
      const stock = await prisma.stock.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId,
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

    const delivery = await prisma.delivery.create({
      data: {
        reference,
        customerName,
        locationId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        userId: req.user.id,
        status: 'DRAFT',
        lines: {
          create: lines.map((line: any) => ({
            productId: line.productId,
            quantity: line.quantity,
            deliveredQty: 0,
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
      message: 'Delivery created successfully',
      delivery,
    });
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
};

export const validateDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        lines: true,
        location: true,
      },
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.status === 'DONE') {
      return res.status(400).json({ error: 'Delivery already validated' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check stock availability again
      for (const line of delivery.lines) {
        const stock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: delivery.locationId,
            },
          },
        });

        if (!stock || stock.available < line.quantity) {
          throw new Error(`Insufficient stock for product ID: ${line.productId}`);
        }
      }

      // Update delivery status
      const updatedDelivery = await tx.delivery.update({
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
      for (const line of delivery.lines) {
        // Update stock
        await tx.stock.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: delivery.locationId,
            },
          },
          data: {
            quantity: { decrement: line.quantity },
            available: { decrement: line.quantity },
          },
        });

        // Create stock move
        await tx.stockMove.create({
          data: {
            reference: delivery.reference,
            productId: line.productId,
            fromLocationId: delivery.locationId,
            quantity: line.quantity,
            moveType: 'DELIVERY',
            status: 'DONE',
            userId: req.user!.id,
            deliveryId: delivery.id,
          },
        });
      }

      return updatedDelivery;
    });

    res.json({
      message: 'Delivery validated successfully',
      delivery: result,
    });
  } catch (error: any) {
    console.error('Validate delivery error:', error);
    res.status(500).json({ error: error.message || 'Failed to validate delivery' });
  }
};

export const cancelDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.status === 'DONE') {
      return res.status(400).json({ error: 'Cannot cancel validated delivery' });
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        lines: {
          include: { product: true },
        },
      },
    });

    res.json({
      message: 'Delivery cancelled successfully',
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error('Cancel delivery error:', error);
    res.status(500).json({ error: 'Failed to cancel delivery' });
  }
};

