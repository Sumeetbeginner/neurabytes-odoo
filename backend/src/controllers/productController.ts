import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, search, lowStock } = req.query;

    const where: any = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        stockLevels: {
          include: {
            location: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total stock for each product
    const productsWithStock = products.map((product) => {
      const totalStock = product.stockLevels.reduce(
        (sum, stock) => sum + stock.quantity,
        0
      );
      const totalAvailable = product.stockLevels.reduce(
        (sum, stock) => sum + stock.available,
        0
      );

      return {
        ...product,
        totalStock,
        totalAvailable,
        isLowStock: totalStock <= product.reorderPoint,
        isOutOfStock: totalStock === 0,
      };
    });

    // Filter by low stock if requested
    const filtered = lowStock === 'true'
      ? productsWithStock.filter((p) => p.isLowStock)
      : productsWithStock;

    res.json({ products: filtered });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockLevels: {
          include: {
            location: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const totalStock = product.stockLevels.reduce(
      (sum, stock) => sum + stock.quantity,
      0
    );

    res.json({
      product: {
        ...product,
        totalStock,
        isLowStock: totalStock <= product.reorderPoint,
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      sku,
      description,
      categoryId,
      unitOfMeasure,
      reorderPoint,
      optimalStock,
      imageUrl,
    } = req.body;

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingSku) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        categoryId,
        unitOfMeasure: unitOfMeasure || 'Unit',
        reorderPoint: reorderPoint || 0,
        optimalStock: optimalStock || 0,
        imageUrl,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      categoryId,
      unitOfMeasure,
      reorderPoint,
      optimalStock,
      imageUrl,
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if SKU is being changed and if it's already in use
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      });

      if (skuExists) {
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        categoryId,
        unitOfMeasure,
        reorderPoint,
        optimalStock,
        imageUrl,
      },
      include: {
        category: true,
      },
    });

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Product deleted successfully',
      product,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const getProductStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const stockLevels = await prisma.stock.findMany({
      where: { productId: id },
      include: {
        location: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: {
        quantity: 'desc',
      },
    });

    res.json({ stockLevels });
  } catch (error) {
    console.error('Get product stock error:', error);
    res.status(500).json({ error: 'Failed to get product stock' });
  }
};

// Categories
export const getCategories = async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const category = await prisma.category.create({
      data: { name, description },
    });

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};
