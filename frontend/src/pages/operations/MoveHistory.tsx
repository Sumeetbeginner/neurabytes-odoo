import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StockMove } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { History, Search, Package, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

const MoveHistory: React.FC = () => {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moveTypeFilter, setMoveTypeFilter] = useState<string>('');

  useEffect(() => {
    fetchMoves();
  }, [moveTypeFilter]);

  const fetchMoves = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (moveTypeFilter) params.moveType = moveTypeFilter;

      const response = await api.getStockMoves(params);
      let movesList = response.moves || [];

      if (searchTerm) {
        movesList = movesList.filter(
          (m: StockMove) =>
            m.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.product?.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setMoves(movesList);
    } catch (error) {
      console.error('Failed to fetch moves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMoves();
  };

  const getMoveTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string; icon: any }> = {
      RECEIPT: { label: 'Receipt', className: 'badge-primary', icon: TrendingUp },
      DELIVERY: { label: 'Delivery', className: 'badge-danger', icon: TrendingDown },
      TRANSFER: { label: 'Transfer', className: 'badge-warning', icon: ArrowRight },
      ADJUSTMENT: { label: 'Adjustment', className: 'badge-gray', icon: Minus },
    };

    const config = typeConfig[type] || typeConfig.RECEIPT;
    const Icon = config.icon;

    return (
      <span className={`${config.className} flex items-center gap-1`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const getAdjustmentDirection = (move: StockMove) => {
    if (move.moveType !== 'ADJUSTMENT') return null;
    // For adjustments: fromLocation means decrease, toLocation means increase
    if (move.fromLocation) {
      return { type: 'decrease', location: move.fromLocation };
    }
    if (move.toLocation) {
      return { type: 'increase', location: move.toLocation };
    }
    return null;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Move History</h1>
        <p className="text-gray-600 mt-1">Complete audit trail of all stock movements</p>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by reference, product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </form>

          <select
            value={moveTypeFilter}
            onChange={(e) => setMoveTypeFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="">All Types</option>
            <option value="RECEIPT">Receipt</option>
            <option value="DELIVERY">Delivery</option>
            <option value="TRANSFER">Transfer</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {moves.length === 0 ? (
          <div className="text-center py-12">
            <History size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No moves found</h3>
            <p className="text-gray-600">
              {searchTerm || moveTypeFilter
                ? 'Try adjusting your filters'
                : 'Stock movements will appear here once operations are validated'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {moves.map((move) => {
                  const adjustmentDir = getAdjustmentDirection(move);
                  return (
                    <tr key={move.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(move.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          {move.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getMoveTypeBadge(move.moveType)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package size={16} className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {move.product?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {move.product?.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {move.moveType === 'ADJUSTMENT' && adjustmentDir?.type === 'decrease' ? (
                          <div className="flex items-center text-red-600">
                            <TrendingDown size={14} className="mr-1" />
                            {adjustmentDir.location.warehouse?.name} - {adjustmentDir.location.name}
                          </div>
                        ) : move.fromLocation ? (
                          <div>
                            {move.fromLocation.warehouse?.name} - {move.fromLocation.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {move.moveType === 'ADJUSTMENT' && adjustmentDir?.type === 'increase' ? (
                          <div className="flex items-center text-green-600">
                            <TrendingUp size={14} className="mr-1" />
                            {adjustmentDir.location.warehouse?.name} - {adjustmentDir.location.name}
                          </div>
                        ) : move.toLocation ? (
                          <div className="flex items-center">
                            <ArrowRight size={14} className="mr-1 text-gray-400" />
                            {move.toLocation.warehouse?.name} - {move.toLocation.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {move.quantity.toFixed(2)} {move.product?.unitOfMeasure || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {move.user?.firstName} {move.user?.lastName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
