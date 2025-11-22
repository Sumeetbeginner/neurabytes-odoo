import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DashboardKPIs } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Package,
  AlertTriangle,
  PackageX,
  PackageCheck,
  PackageMinus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [kpisResponse, statsResponse] = await Promise.all([
        api.getDashboardKPIs(),
        api.getDashboardStats(30),
      ]);
      setKpis(kpisResponse.kpis);
      setStats(statsResponse.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Prepare chart data
  const movesByTypeData = stats?.movesByType?.map((item: any) => ({
    name: item.moveType,
    count: item._count.id,
  })) || [];

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#6b7280'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your inventory operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpis?.totalProducts || 0}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Package className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <Link to="/products?lowStock=true" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{kpis?.lowStockCount || 0}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
          </div>
        </Link>

        {/* Out of Stock */}
        <Link to="/products?outOfStock=true" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{kpis?.outOfStockCount || 0}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <PackageX className="text-red-600" size={24} />
            </div>
          </div>
        </Link>

        {/* Pending Receipts */}
        <Link to="/receipts?status=DRAFT,WAITING,READY" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Receipts</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{kpis?.pendingReceipts || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <PackageCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </Link>

        {/* Pending Deliveries */}
        <Link to="/deliveries?status=DRAFT,WAITING,READY" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Deliveries</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{kpis?.pendingDeliveries || 0}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <PackageMinus className="text-purple-600" size={24} />
            </div>
          </div>
        </Link>

        {/* Scheduled Transfers */}
        <Link to="/transfers?status=DRAFT,WAITING,READY" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled Transfers</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{kpis?.scheduledTransfers || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <ArrowLeftRight className="text-green-600" size={24} />
            </div>
          </div>
        </Link>

        {/* Recent Receipts (7 days) */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receipts (7 days)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpis?.recentReceipts || 0}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <TrendingUp className="text-gray-600" size={24} />
            </div>
          </div>
        </div>

        {/* Recent Deliveries (7 days) */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deliveries (7 days)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpis?.recentDeliveries || 0}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <TrendingDown className="text-gray-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Moves by Type */}
          {movesByTypeData.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Moves by Type (30 days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={movesByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stock Moves Distribution */}
          {movesByTypeData.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Moves Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={movesByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {movesByTypeData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/products/new" className="btn-primary text-center">
            + New Product
          </Link>
          <Link to="/receipts/new" className="btn-primary text-center">
            + New Receipt
          </Link>
          <Link to="/deliveries/new" className="btn-primary text-center">
            + New Delivery
          </Link>
          <Link to="/transfers/new" className="btn-primary text-center">
            + New Transfer
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {(kpis && (kpis.lowStockCount > 0 || kpis.outOfStockCount > 0)) && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-600 mt-1 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900">Inventory Alerts</h3>
              <ul className="mt-2 text-sm text-yellow-800 space-y-1">
                {kpis.lowStockCount > 0 && (
                  <li>• {kpis.lowStockCount} product(s) below reorder point</li>
                )}
                {kpis.outOfStockCount > 0 && (
                  <li>• {kpis.outOfStockCount} product(s) out of stock</li>
                )}
              </ul>
              <Link to="/products?lowStock=true" className="text-yellow-700 hover:text-yellow-900 font-medium text-sm mt-2 inline-block">
                View details →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
