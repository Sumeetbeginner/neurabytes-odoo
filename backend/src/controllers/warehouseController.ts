import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getWarehouses = async (_req: AuthRequest, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        locations: {
          where: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ warehouses });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to get warehouses' });
  }
};

export const createWarehouse = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, address } = req.body;

    const warehouse = await prisma.warehouse.create({
      data: { name, code, address },
    });

    res.status(201).json({
      message: 'Warehouse created successfully',
      warehouse,
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
};

export const getLocations = async (req: AuthRequest, res: Response) => {
  try {
    const { warehouseId } = req.query;

    const where: any = { isActive: true };
    if (warehouseId) {
      where.warehouseId = warehouseId as string;
    }

    const locations = await prisma.location.findMany({
      where,
      include: {
        warehouse: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ locations });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
};

export const createLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { warehouseId, name, code, type } = req.body;

    const location = await prisma.location.create({
      data: { warehouseId, name, code, type: type || 'INTERNAL' },
      include: { warehouse: true },
    });

    res.status(201).json({
      message: 'Location created successfully',
      location,
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
};
