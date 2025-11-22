import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { StockAdjustment } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, CheckCircle, XCircle, ClipboardList, Warehouse, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const AdjustmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAdjustment();
    }
  }, [id]);

  const fetchAdjustment = async () => {
    try {
      const response = await api.getAdjustment(id!);
      setAdjustment(response.adjustment);
    } catch (error) {
      console.error('Failed to fetch adjustment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!window.confirm('Are you sure you want to validate this adjustment? This will update stock levels.')) {
      return;
    }

    setProcessing(true);
    try {
      await api.validateAdjustment(id!);
      fetchAdjustment();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to validate adjustment');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this adjustment?')) {
      return;
    }

    setProcessing(true);
    try {
      await api.cancelAdjustment(id!);
      fetchAdjustment();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel adjustment');
    } finally {
      setProcessing(false);
    }
  };

  const canValidate = adjustment && ['DRAFT', 'WAITING', 'READY'].includes(adjustment.status) && (user?.role === 'ADMIN' || user?.role === 'MANAGER');
  const canCancel = adjustment && adjustment.status !== 'DONE' && adjustment.status !== 'CANCELLED';

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!adjustment) {
    return (
      <div className="card text-center py-12">
        <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Adjustment not found</h3>
        <Link to="/adjustments" className="btn-primary mt-4">
          Back to Adjustments
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/adjustments" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{adjustment.reference}</h1>
            <p className="text-gray-600 mt-1">Adjustment details and validation</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjustment Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Reference</label>
                <p className="text-gray-900 font-mono mt-1">{adjustment.reference}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(adjustment.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <div className="mt-1 flex items-center text-gray-900">
                  <Warehouse size={16} className="mr-2 text-gray-400" />
                  {adjustment.location?.warehouse?.name} - {adjustment.location?.name}
                </div>
              </div>
              {adjustment.adjustmentDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Adjustment Date</label>
                  <div className="mt-1 flex items-center text-gray-900">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {format(new Date(adjustment.adjustmentDate), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <div className="mt-1 flex items-center text-gray-900">
                  <User size={16} className="mr-2 text-gray-400" />
                  {adjustment.user?.firstName} {adjustment.user?.lastName}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900 mt-1">
                  {format(new Date(adjustment.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {adjustment.reason && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="text-gray-900 mt-1">{adjustment.reason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
            {adjustment.lines && adjustment.lines.length > 0 ? (
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
                        System Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Counted Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adjustment.lines.map((line) => (
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
                          {line.systemQty.toFixed(2)} {line.product?.unitOfMeasure || ''}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                          {line.countedQty.toFixed(2)} {line.product?.unitOfMeasure || ''}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-medium ${
                          line.difference > 0 ? 'text-green-600' : line.difference < 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {line.difference > 0 ? '+' : ''}{line.difference.toFixed(2)} {line.product?.unitOfMeasure || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No products in this adjustment</p>
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
                  {adjustment.lines?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentDetails;
