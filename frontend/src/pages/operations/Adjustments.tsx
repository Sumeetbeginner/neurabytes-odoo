import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { StockAdjustment, Location } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList, Plus, Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

const Adjustments: React.FC = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchLocations();
    const status = searchParams.get('status');
    if (status) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    fetchAdjustments();
  }, [statusFilter, locationFilter]);

  const fetchLocations = async () => {
    try {
      const response = await api.getLocations();
      setLocations(response.locations || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (locationFilter) params.locationId = locationFilter;

      const response = await api.getAdjustments(params);
      let adjustmentsList = response.adjustments || [];

      if (searchTerm) {
        adjustmentsList = adjustmentsList.filter((a: StockAdjustment) =>
          a.reference.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setAdjustments(adjustmentsList);
    } catch (error) {
      console.error('Failed to fetch adjustments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdjustments();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      DRAFT: { label: 'Draft', className: 'badge-gray', icon: Clock },
      WAITING: { label: 'Waiting', className: 'badge-warning', icon: Clock },
      READY: { label: 'Ready', className: 'badge-primary', icon: Clock },
      DONE: { label: 'Done', className: 'badge-success', icon: CheckCircle },
      CANCELLED: { label: 'Cancelled', className: 'badge-danger', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span className={`${config.className} flex items-center gap-1`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Adjustments</h1>
          <p className="text-gray-600 mt-1">Fix stock discrepancies and reconcile inventory</p>
        </div>
        <Link to="/adjustments/new" className="btn-primary flex items-center">
          <Plus size={20} className="mr-2" />
          New Adjustment
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.warehouse?.name} - {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {adjustments.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No adjustments found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || locationFilter
                ? 'Try adjusting your filters'
                : 'Get started by creating your first adjustment'}
            </p>
            {!searchTerm && !statusFilter && !locationFilter && (
              <Link to="/adjustments/new" className="btn-primary">
                New Adjustment
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adjustment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{adjustment.reference}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {adjustment.location?.warehouse?.name} - {adjustment.location?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(adjustment.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adjustment.adjustmentDate
                        ? format(new Date(adjustment.adjustmentDate), 'MMM dd, yyyy')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adjustment.user?.firstName} {adjustment.user?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/adjustments/${adjustment.id}`}
                        className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded inline-flex items-center"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Adjustments;
