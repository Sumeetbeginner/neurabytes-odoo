import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Warehouse, Location } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Warehouse as WarehouseIcon, Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Warehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationForm, setLocationForm] = useState({
    warehouseId: '',
    name: '',
    code: '',
    type: 'INTERNAL',
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const response = await api.getWarehouses();
      setWarehouses(response.warehouses || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLocation(locationForm);
      setShowLocationForm(false);
      setLocationForm({ warehouseId: '', name: '', code: '', type: 'INTERNAL' });
      fetchWarehouses();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create location');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouses & Locations</h1>
          <p className="text-gray-600 mt-1">Manage your storage facilities and locations</p>
        </div>
        <button
          onClick={() => setShowLocationForm(!showLocationForm)}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add Location
        </button>
      </div>

      {showLocationForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Location</h2>
          <form onSubmit={handleCreateLocation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={locationForm.warehouseId}
                  onChange={(e) =>
                    setLocationForm((prev) => ({ ...prev, warehouseId: e.target.value }))
                  }
                  className="input"
                  required
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) =>
                    setLocationForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g., Aisle 1, Shelf B"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationForm.code}
                  onChange={(e) =>
                    setLocationForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                  className="input font-mono"
                  placeholder="LOC-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={locationForm.type}
                  onChange={(e) =>
                    setLocationForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="input"
                  required
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="SUPPLIER">Supplier</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="PRODUCTION">Production</option>
                  <option value="SCRAP">Scrap</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowLocationForm(false);
                  setLocationForm({ warehouseId: '', name: '', code: '', type: 'INTERNAL' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Location
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <WarehouseIcon size={24} className="text-primary-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{warehouse.name}</h2>
                  <p className="text-sm text-gray-500 font-mono">{warehouse.code}</p>
                  {warehouse.address && (
                    <p className="text-sm text-gray-600 mt-1">{warehouse.address}</p>
                  )}
                </div>
              </div>
              <span className={`badge ${warehouse.isActive ? 'badge-success' : 'badge-gray'}`}>
                {warehouse.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {warehouse.locations && warehouse.locations.length > 0 ? (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Locations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {warehouse.locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{location.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{location.code}</div>
                          <div className="text-xs text-gray-500">{location.type}</div>
                        </div>
                      </div>
                      <span className={`badge ${location.isActive ? 'badge-success' : 'badge-gray'}`}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-4 text-center py-4 text-gray-500">
                <MapPin size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No locations in this warehouse</p>
              </div>
            )}
          </div>
        ))}

        {warehouses.length === 0 && (
          <div className="card text-center py-12">
            <WarehouseIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
            <p className="text-gray-600">Warehouses will appear here once created</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Warehouses;
