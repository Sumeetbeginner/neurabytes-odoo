import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Product, Stock } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Edit, Package, AlertTriangle, PackageX, Warehouse, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [stockLevels, setStockLevels] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchStock();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.getProduct(id!);
      setProduct(response.product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStock = async () => {
    try {
      const response = await api.getProductStock(id!);
      setStockLevels(response.stockLevels || []);
    } catch (error) {
      console.error('Failed to fetch stock:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return (
      <div className="card text-center py-12">
        <Package size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <Link to="/products" className="btn-primary mt-4">
          Back to Products
        </Link>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (product.isOutOfStock) {
      return <span className="badge-danger">Out of Stock</span>;
    }
    if (product.isLowStock) {
      return <span className="badge-warning">Low Stock</span>;
    }
    return <span className="badge-success">In Stock</span>;
  };

  const totalStock = stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
  const totalAvailable = stockLevels.reduce((sum, stock) => sum + stock.available, 0);
  const totalReserved = stockLevels.reduce((sum, stock) => sum + stock.reserved, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/products" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 mt-1">Product details and stock information</p>
          </div>
        </div>
        <Link to={`/products/${id}/edit`} className="btn-primary flex items-center">
          <Edit size={18} className="mr-2" />
          Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">SKU</label>
                <p className="text-gray-900 font-mono mt-1">{product.sku}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-900 mt-1">{product.category?.name || 'Uncategorized'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Unit of Measure</label>
                <p className="text-gray-900 mt-1">{product.unitOfMeasure}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
              {product.description && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{product.description}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Reorder Point</label>
                <p className="text-gray-900 mt-1">
                  {product.reorderPoint} {product.unitOfMeasure}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Optimal Stock</label>
                <p className="text-gray-900 mt-1">
                  {product.optimalStock} {product.unitOfMeasure}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900 mt-1">
                  {format(new Date(product.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Levels by Location */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock by Location</h2>
            {stockLevels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package size={32} className="mx-auto mb-2 text-gray-400" />
                <p>No stock available in any location</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Warehouse
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Location
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Reserved
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Available
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockLevels.map((stock) => (
                      <tr key={stock.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Warehouse size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {stock.location?.warehouse?.name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{stock.location?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          {stock.quantity.toFixed(2)} {product.unitOfMeasure}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                          {stock.reserved.toFixed(2)} {product.unitOfMeasure}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {stock.available.toFixed(2)} {product.unitOfMeasure}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Summary</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Stock</span>
                  <span className="text-lg font-bold text-gray-900">
                    {totalStock.toFixed(2)} {product.unitOfMeasure}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${product.optimalStock > 0 ? Math.min((totalStock / product.optimalStock) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="text-sm font-medium text-green-600">
                    {totalAvailable.toFixed(2)} {product.unitOfMeasure}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reserved</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {totalReserved.toFixed(2)} {product.unitOfMeasure}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(product.isLowStock || product.isOutOfStock) && (
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-start">
                {product.isOutOfStock ? (
                  <PackageX className="text-red-600 mt-1 mr-3 flex-shrink-0" size={20} />
                ) : (
                  <AlertTriangle className="text-yellow-600 mt-1 mr-3 flex-shrink-0" size={20} />
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {product.isOutOfStock ? 'Out of Stock' : 'Low Stock Alert'}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {product.isOutOfStock
                      ? 'This product has no stock available.'
                      : `Current stock (${totalStock.toFixed(2)}) is below the reorder point (${product.reorderPoint}).`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/receipts/new" className="btn-primary w-full text-center block">
                Create Receipt
              </Link>
              <Link to="/deliveries/new" className="btn-secondary w-full text-center block">
                Create Delivery
              </Link>
              <Link to="/transfers/new" className="btn-secondary w-full text-center block">
                Create Transfer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
