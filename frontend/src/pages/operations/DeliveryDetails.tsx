import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Delivery } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, CheckCircle, XCircle, PackageMinus, Warehouse, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const DeliveryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDelivery();
    }
  }, [id]);

  const fetchDelivery = async () => {
    try {
      const response = await api.getDelivery(id!);
      setDelivery(response.delivery);
    } catch (error) {
      console.error('Failed to fetch delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!window.confirm('Are you sure you want to validate this delivery? This will decrease stock levels.')) {
      return;
    }

    setProcessing(true);
    try {
      await api.validateDelivery(id!);
      fetchDelivery();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to validate delivery');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this delivery?')) {
      return;
    }

    setProcessing(true);
    try {
      await api.cancelDelivery(id!);
      fetchDelivery();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel delivery');
    } finally {
      setProcessing(false);
    }
  };

  const canValidate = delivery && ['DRAFT', 'WAITING', 'READY'].includes(delivery.status) && (user?.role === 'ADMIN' || user?.role === 'MANAGER');
  const canCancel = delivery && delivery.status !== 'DONE' && delivery.status !== 'CANCELLED';

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!delivery) {
    return (
      <div className="card text-center py-12">
        <PackageMinus size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery not found</h3>
        <Link to="/deliveries" className="btn-primary mt-4">
          Back to Deliveries
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Draft', className: 'badge-gray' },
      WAITING: { label: 'Waiting', className: 'badge-warning' },
      READY: { label: 'Ready', className: 'badge-primary' },
      DONE: { label: 'Done', className: 'badge-success' },
      CANCELLED: { label: 'Cancelled', className: 'badge-danger' },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return <span className={config.className}>{config.label}</span>;
  };

  const totalQuantity = delivery.lines?.reduce((sum, line) => sum + line.quantity, 0) || 0;
  const totalDelivered = delivery.lines?.reduce((sum, line) => sum + line.deliveredQty, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/deliveries" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{delivery.reference}</h1>
            <p className="text-gray-600 mt-1">Delivery details and validation</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canValidate && (
            <button
              onClick={handleValidate}
              disabled={processing}
              className="btn-success flex items-center"
            >
              <CheckCircle size={18} className="mr-2" />
              {processing ? 'Processing...' : 'Validate'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={processing}
              className="btn-danger flex items-center"
            >
              <XCircle size={18} className="mr-2" />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Reference</label>
                <p className="text-gray-900 font-mono mt-1">{delivery.reference}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(delivery.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Customer</label>
                <p className="text-gray-900 mt-1">{delivery.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <div className="mt-1 flex items-center text-gray-900">
                  <Warehouse size={16} className="mr-2 text-gray-400" />
                  {delivery.location?.warehouse?.name} - {delivery.location?.name}
                </div>
              </div>
              {delivery.scheduledDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Scheduled Date</label>
                  <div className="mt-1 flex items-center text-gray-900">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {format(new Date(delivery.scheduledDate), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              )}
              {delivery.validatedDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Validated Date</label>
                  <div className="mt-1 flex items-center text-gray-900">
                    <CheckCircle size={16} className="mr-2 text-gray-400" />
                    {format(new Date(delivery.validatedDate), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <div className="mt-1 flex items-center text-gray-900">
                  <User size={16} className="mr-2 text-gray-400" />
                  {delivery.user?.firstName} {delivery.user?.lastName}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900 mt-1">
                  {format(new Date(delivery.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {delivery.notes && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900 mt-1">{delivery.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
            {delivery.lines && delivery.lines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Delivered
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {delivery.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {line.product?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500 font-mono">
                            {line.product?.sku || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          {line.quantity.toFixed(2)} {line.product?.unitOfMeasure || ''}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          {line.deliveredQty.toFixed(2)} {line.product?.unitOfMeasure || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {totalQuantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {totalDelivered.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No products in this delivery</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Lines</span>
                <span className="text-sm font-medium text-gray-900">
                  {delivery.lines?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Quantity</span>
                <span className="text-sm font-medium text-gray-900">
                  {totalQuantity.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivered</span>
                <span className="text-sm font-medium text-gray-900">
                  {totalDelivered.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetails;
