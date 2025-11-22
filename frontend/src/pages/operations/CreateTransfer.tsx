import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Location, Product } from '../../types';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

const CreateTransfer: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    fromLocationId: '',
    toLocationId: '',
    scheduledDate: '',
    notes: '',
  });
  const [lines, setLines] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: '', quantity: 0 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLocations();
    fetchProducts();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.getLocations();
      setLocations(response.locations || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.getProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLineChange = (index: number, field: string, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { productId: '', quantity: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fromLocationId) newErrors.fromLocationId = 'From location is required';
    if (!formData.toLocationId) newErrors.toLocationId = 'To location is required';
    if (formData.fromLocationId === formData.toLocationId) {
      newErrors.toLocationId = 'To location must be different from from location';
    }
    if (lines.length === 0 || lines.every((l) => !l.productId || l.quantity <= 0)) {
      newErrors.lines = 'At least one product line is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const transferData = {
        ...formData,
        lines: lines.filter((l) => l.productId && l.quantity > 0),
        scheduledDate: formData.scheduledDate || undefined,
      };
      await api.createTransfer(transferData);
      navigate('/transfers');
    } catch (error: any) {
      console.error('Failed to create transfer:', error);
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      } else {
        setErrors({ submit: 'Failed to create transfer. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/transfers" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Transfer</h1>
            <p className="text-gray-600 mt-1">Transfer stock between locations</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Location <span className="text-red-500">*</span>
            </label>
            <select
              name="fromLocationId"
              value={formData.fromLocationId}
              onChange={handleChange}
              className={`input ${errors.fromLocationId ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select from location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.warehouse?.name} - {loc.name}
                </option>
              ))}
            </select>
            {errors.fromLocationId && (
              <p className="text-red-500 text-sm mt-1">{errors.fromLocationId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Location <span className="text-red-500">*</span>
            </label>
            <select
              name="toLocationId"
              value={formData.toLocationId}
              onChange={handleChange}
              className={`input ${errors.toLocationId ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select to location</option>
              {locations
                .filter((loc) => loc.id !== formData.fromLocationId)
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.warehouse?.name} - {loc.name}
                  </option>
                ))}
            </select>
            {errors.toLocationId && (
              <p className="text-red-500 text-sm mt-1">{errors.toLocationId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
            <input
              type="datetime-local"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <button
              type="button"
              onClick={addLine}
              className="btn-secondary flex items-center text-sm"
            >
              <Plus size={16} className="mr-1" />
              Add Product
            </button>
          </div>

          {errors.lines && <p className="text-red-500 text-sm mb-4">{errors.lines}</p>}

          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="flex gap-4 items-start p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                  <select
                    value={line.productId}
                    onChange={(e) => handleLineChange(index, 'productId', e.target.value)}
                    className="input"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) =>
                      handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="text-red-600 hover:text-red-900 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <Link to="/transfers" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary flex items-center" disabled={loading}>
            <Save size={18} className="mr-2" />
            {loading ? 'Creating...' : 'Create Transfer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTransfer;
