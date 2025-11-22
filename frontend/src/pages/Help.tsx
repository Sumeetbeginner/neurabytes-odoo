import React, { useState } from 'react';
import {
  HelpCircle,
  Package,
  PackageCheck,
  PackageMinus,
  ArrowLeftRight,
  ClipboardList,
  LayoutDashboard,
  Warehouse,
  History,
  ChevronRight,
  BookOpen,
  Video,
  MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Help: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('getting-started');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Welcome to StockMaster</h3>
            <p className="text-gray-600">
              StockMaster is a comprehensive inventory management system designed to help you track,
              manage, and optimize your stock levels across multiple warehouses and locations.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Key Features</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Real-time inventory tracking</li>
              <li>Multi-warehouse and location support</li>
              <li>Stock operations (Receipts, Deliveries, Transfers, Adjustments)</li>
              <li>Low stock alerts and reorder points</li>
              <li>Complete audit trail of all movements</li>
              <li>Role-based access control</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
            <p className="text-gray-600">
              The dashboard provides a comprehensive overview of your inventory at a glance. You'll
              see key performance indicators (KPIs) and quick access to important information.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">KPI Cards</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <strong>Total Products:</strong> Number of active products in your catalog
              </li>
              <li>
                <strong>Low Stock Items:</strong> Products below their reorder point
              </li>
              <li>
                <strong>Out of Stock:</strong> Products with zero inventory
              </li>
              <li>
                <strong>Pending Operations:</strong> Receipts, deliveries, and transfers awaiting
                validation
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Charts</h3>
            <p className="text-gray-600">
              Visual charts show stock movements by type and distribution over the last 30 days,
              helping you understand inventory trends.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'products',
      title: 'Products Management',
      icon: Package,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Managing Products</h3>
            <p className="text-gray-600">
              Products are the core of your inventory. Each product has a unique SKU, category,
              unit of measure, and stock thresholds.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Creating a Product</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Click "Add Product" from the Products page</li>
              <li>Enter product name and SKU (must be unique)</li>
              <li>Select a category (optional)</li>
              <li>Set reorder point and optimal stock levels</li>
              <li>Choose unit of measure (Unit, Kg, L, etc.)</li>
              <li>Add product image URL (optional)</li>
              <li>Click "Create Product"</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Stock Levels</h3>
            <p className="text-gray-600">
              View stock levels by location on the product details page. You can see total
              quantity, reserved quantity, and available quantity for each location.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Low Stock Alerts</h3>
            <p className="text-gray-600">
              Products below their reorder point are automatically flagged. Use the "Low Stock"
              filter to quickly identify items that need reordering.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'receipts',
      title: 'Receipts',
      icon: PackageCheck,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What are Receipts?</h3>
            <p className="text-gray-600">
              Receipts record incoming stock from suppliers. When validated, they increase stock
              levels at the specified location.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Creating a Receipt</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Click "New Receipt" from the Receipts page</li>
              <li>Enter supplier name</li>
              <li>Select the receiving location</li>
              <li>Add products and quantities</li>
              <li>Set scheduled date (optional)</li>
              <li>Add notes if needed</li>
              <li>Click "Create Receipt"</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Validating Receipts</h3>
            <p className="text-gray-600">
              Only ADMIN and MANAGER roles can validate receipts. Validation updates stock levels
              and creates stock move records. Once validated, the receipt status changes to "DONE".
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Receipt Statuses</h3>
            <ul className="space-y-1 text-gray-600">
              <li>
                <strong>DRAFT:</strong> Created but not yet processed
              </li>
              <li>
                <strong>WAITING:</strong> Waiting for stock to arrive
              </li>
              <li>
                <strong>READY:</strong> Ready for validation
              </li>
              <li>
                <strong>DONE:</strong> Validated and stock updated
              </li>
              <li>
                <strong>CANCELLED:</strong> Cancelled receipt
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'deliveries',
      title: 'Deliveries',
      icon: PackageMinus,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What are Deliveries?</h3>
            <p className="text-gray-600">
              Deliveries record outgoing stock to customers. When validated, they decrease stock
              levels at the specified location.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Creating a Delivery</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Click "New Delivery" from the Deliveries page</li>
              <li>Enter customer name</li>
              <li>Select the shipping location</li>
              <li>Add products and quantities</li>
              <li>Set scheduled date (optional)</li>
              <li>Add notes if needed</li>
              <li>Click "Create Delivery"</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Stock Availability</h3>
            <p className="text-gray-600">
              The system checks stock availability when creating deliveries. Ensure sufficient stock
              is available at the selected location before validation.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'transfers',
      title: 'Transfers',
      icon: ArrowLeftRight,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What are Transfers?</h3>
            <p className="text-gray-600">
              Transfers move stock between locations within your warehouse network. They decrease
              stock at the source location and increase it at the destination.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Creating a Transfer</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Click "New Transfer" from the Transfers page</li>
              <li>Select "From Location" (source)</li>
              <li>Select "To Location" (destination) - must be different</li>
              <li>Add products and quantities</li>
              <li>Set scheduled date (optional)</li>
              <li>Add notes if needed</li>
              <li>Click "Create Transfer"</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Transfer Validation</h3>
            <p className="text-gray-600">
              Validation moves stock from the source to destination location. Both locations must
              have sufficient stock available.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'adjustments',
      title: 'Stock Adjustments',
      icon: ClipboardList,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What are Adjustments?</h3>
            <p className="text-gray-600">
              Adjustments reconcile physical stock counts with system records. Use them when you
              find discrepancies during inventory counts.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Creating an Adjustment</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Click "New Adjustment" from the Adjustments page</li>
              <li>Select the location to adjust</li>
              <li>Add products and enter the counted quantity</li>
              <li>The system calculates the difference automatically</li>
              <li>Add reason for adjustment (optional)</li>
              <li>Click "Create Adjustment"</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Understanding Differences</h3>
            <ul className="space-y-1 text-gray-600">
              <li>
                <strong>Positive difference:</strong> Counted more than system shows (stock increase)
              </li>
              <li>
                <strong>Negative difference:</strong> Counted less than system shows (stock
                decrease)
              </li>
              <li>
                <strong>Zero difference:</strong> Count matches system (no change)
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Move History</h3>
            <p className="text-gray-600">
              Validated adjustments appear in Move History. Adjustments show as increases (green)
              or decreases (red) at the adjusted location.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'warehouses',
      title: 'Warehouses & Locations',
      icon: Warehouse,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Warehouse Structure</h3>
            <p className="text-gray-600">
              StockMaster supports multiple warehouses, each containing multiple locations. This
              allows you to organize inventory hierarchically.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Location Types</h3>
            <ul className="space-y-1 text-gray-600">
              <li>
                <strong>INTERNAL:</strong> Regular storage location within warehouse
              </li>
              <li>
                <strong>SUPPLIER:</strong> Location representing supplier (for receipts)
              </li>
              <li>
                <strong>CUSTOMER:</strong> Location representing customer (for deliveries)
              </li>
              <li>
                <strong>PRODUCTION:</strong> Production or manufacturing area
              </li>
              <li>
                <strong>SCRAP:</strong> Scrap or waste area
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Creating Locations</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Go to Settings → Warehouses</li>
              <li>Click "Add Location"</li>
              <li>Select the warehouse</li>
              <li>Enter location name and code</li>
              <li>Choose location type</li>
              <li>Click "Create Location"</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'move-history',
      title: 'Move History',
      icon: History,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What is Move History?</h3>
            <p className="text-gray-600">
              Move History provides a complete audit trail of all stock movements. Every validated
              operation creates stock move records.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Viewing Moves</h3>
            <ul className="space-y-1 text-gray-600">
              <li>Filter by move type (Receipt, Delivery, Transfer, Adjustment)</li>
              <li>Search by reference, product name, or SKU</li>
              <li>See from/to locations for each move</li>
              <li>View user who performed the operation</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Understanding Adjustment Moves</h3>
            <p className="text-gray-600">
              Adjustments appear in move history with special indicators:
            </p>
            <ul className="space-y-1 text-gray-600 mt-2">
              <li>
                <strong>Red arrow down:</strong> Stock decrease (counted less than system)
              </li>
              <li>
                <strong>Green arrow up:</strong> Stock increase (counted more than system)
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'roles',
      title: 'User Roles & Permissions',
      icon: MessageCircle,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Role Hierarchy</h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <strong>ADMIN:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Full system access</li>
                  <li>Create, edit, and delete all records</li>
                  <li>Validate all operations</li>
                  <li>Manage warehouses and locations</li>
                </ul>
              </li>
              <li>
                <strong>MANAGER:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Manage products and inventory</li>
                  <li>Create and validate operations</li>
                  <li>View all reports and history</li>
                  <li>Cannot delete critical records</li>
                </ul>
              </li>
              <li>
                <strong>STAFF:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>View products and inventory</li>
                  <li>Create operations (receipts, deliveries, transfers)</li>
                  <li>Cannot validate operations</li>
                  <li>View move history</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Documentation</h1>
        <p className="text-gray-600 mt-1">Learn how to use StockMaster effectively</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/dashboard"
          className="card hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <LayoutDashboard className="text-primary-600" size={24} />
          <div>
            <h3 className="font-semibold text-gray-900">Dashboard</h3>
            <p className="text-sm text-gray-600">View overview</p>
          </div>
        </Link>
        <Link
          to="/products"
          className="card hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <Package className="text-primary-600" size={24} />
          <div>
            <h3 className="font-semibold text-gray-900">Products</h3>
            <p className="text-sm text-gray-600">Manage inventory</p>
          </div>
        </Link>
        <Link
          to="/moves"
          className="card hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <History className="text-primary-600" size={24} />
          <div>
            <h3 className="font-semibold text-gray-900">Move History</h3>
            <p className="text-sm text-gray-600">View audit trail</p>
          </div>
        </Link>
      </div>

      {/* Help Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;

          return (
            <div key={section.id} className="card">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-primary-600" size={24} />
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                </div>
                <ChevronRight
                  className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-90' : ''}`}
                  size={20}
                />
              </button>
              {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-200">{section.content}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <HelpCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Pro Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Set reorder points to get automatic low stock alerts</li>
              <li>• Use scheduled dates for better planning</li>
              <li>• Always validate operations to update stock levels</li>
              <li>• Check move history regularly for audit purposes</li>
              <li>• Use categories to organize your products</li>
              <li>• Create locations before adding stock operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

