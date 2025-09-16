import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import { HashLoader } from "react-spinners";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend,
} from "recharts";
import {
  Users,
  Package,
  UserCheck,
  Calendar,
  CreditCard,
  DollarSign,
  PieChart as PieChartIcon,
  Bell,
  X,
  Sun,
  Moon,
  Cloud,
  ExternalLink,
} from "lucide-react";
import Swal from "sweetalert2";

const AdminDashboard = () => {
  const [activePeriod, setActivePeriod] = useState("weekly"); // state for weekly,monthly.yearly
  const [customers, setCustomers] = useState(0);
  const [items, setItems] = useState(0);
  const [booking, setBooking] = useState(0);
  const [users, setUsers] = useState(0);
  const [sales, setSales] = useState(0);
  const [bookingCompleted, setBookingCompleted] = useState(0);
  const [bookingPending, setBookingPending] = useState(0);
  const [bookingRejected, setBookingRejected] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [recentCustomer, setRecentCustomer] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef(null);

  const abortRef = useRef(null);
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const base = import.meta.env.VITE_API_BASE_URL;

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${base}/customers/count`, {
          signal: controller.signal,
        });
        setCustomers(res.data?.totalCustomers ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Customer fetch failed:", err);
      }
    };

    const fetchItems = async () => {
      try {
        const res = await axios.get(`${base}/item-details/count`, {
          signal: controller.signal,
        });
        setItems(res.data?.count ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Items fetch failed:", err);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${base}/company-users/count`, {
          signal: controller.signal,
        });
        setUsers(res.data?.len ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Users fetch failed:", err);
      }
    };

    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${base}/bookings/count`, {
          signal: controller.signal,
        });
        setBooking(res.data?.total ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Bookings fetch failed:", err);
      }
    };
    const fetchNotifcations = async () => {
      try {
        const res = await axios.get(`${base}/notifications`, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
          signal: controller.signal,
        });
        setNotifications(res.data);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Bookings fetch failed:", err);
      }
    };

    const fetchBookingRecent = async () => {
      try {
        const res = await axios.get(`${base}/bookings/recent`, {
          signal: controller.signal,
        });
        setRecentCustomer(res.data);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Bookings fetch failed:", err);
      }
    };

    const fetchBookingCompleted = async () => {
      try {
        const res = await axios.get(`${base}/bookings/completed`, {
          signal: controller.signal,
        });
        setBookingCompleted(res.data?.total ?? 0);
        
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Bookings fetch failed:", err);
      }
    };

    const fetchBookingPending = async () => {
      try {
        const res = await axios.get(`${base}/bookings/pending`, {
          signal: controller.signal,
        });
        setBookingPending(res.data?.total ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Bookings fetch failed:", err);
      }
    };

    const fetchBookingRejected = async () => {
      try {
        const res = await axios.get(`${base}/bookings/rejected`, {
          signal: controller.signal,
        });
        setBookingRejected(res.data?.total ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Bookings fetch failed:", err);
      }
    };

    const fetchSales = async () => {
      try {
        const res = await axios.get(`${base}/saleInvoices/count`, {
          signal: controller.signal,
        });
        setSales(res.data?.total ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Sales fetch failed:", err);
      }
    };

    const fetchRevenue = async () => {
      try {
        const res = await axios.get(`${base}/saleInvoices/total-revenue`, {
          signal: controller.signal,
        });
        
        setRevenue(res.data?.totalRevenue ?? 0);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Revenue fetch failed:", err);
      }
    };

    const fetchAll = async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchCustomers(),
        fetchItems(),
        fetchUsers(),
        fetchBookings(),
        fetchBookingCompleted(),
        fetchBookingPending(),
        fetchSales(),
        fetchRevenue(),
        fetchNotifcations(),
        fetchBookingRejected(),
        fetchBookingRecent(),
      ]);
      // Add a slight delay to show loading animation
      setTimeout(() => setLoading(false), 1000);
    };

    fetchAll();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    fetchSalesChart("weekly");
  }, []);

  const fetchSalesChart = async (period = "daily") => {
    try {
      setActivePeriod(period)
      const res = await axios.get(
        `${base}/saleInvoices/chart?period=${period}`
      );

      const transformedData = res.data.map((item) => {
        const date = new Date(item._id);
        let name;

        if (period === "daily" || period === "weekly") {
          const month = date.toLocaleString("default", { month: "short" });
          const day = date.getDate();
          name = `${month} ${day}`;
        } else if (period === "monthly") {
          name = date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          });
        } else if (period === "yearly") {
          name = date.getFullYear();
        }

        return {
          name,
          sales: item.count,
          revenue: item.totalAmount || (Math.random() * 1000).toFixed(2),
        };
      });

      setChartData(transformedData);
    } catch (err) {
      console.error("Sales chart fetch failed:", err);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Mark single notification as read
  const clearNotification = async (id) => {
    try {
      await axios.put(`${base}/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Clear failed:", err);
    }
  };

  // ✅ Mark all notifications as read
  const clearAll = async () => {
    try {
      await axios.put(`${base}/notifications/mark-all`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      setNotifications([]);
    } catch (err) {
      console.error("Clear all failed:", err);
    }
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Get appropriate icon based on time of day
  const getGreetingIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return <Sun className="text-amber-500" size={24} />;
    if (hour < 17) return <Cloud className="text-blue-400" size={24} />;
    return <Moon className="text-indigo-500" size={24} />;
  };

  const summaryData = [
    {
      name: "Total Customers",
      value: customers,
      icon: <Users size={24} />,
      change: "+12%",
      color: "bg-blue-100 text-blue-600",
      border: "border-l-4 border-blue-400",
    },
    {
      name: "Total Products",
      value: items,
      icon: <Package size={24} />,
      change: "+5%",
      color: "bg-green-100 text-green-600",
      border: "border-l-4 border-green-400",
    },
    {
      name: "Total Staff",
      value: users,
      icon: <UserCheck size={24} />,
      change: "+2%",
      color: "bg-purple-100 text-purple-600",
      border: "border-l-4 border-purple-400",
    },
    {
      name: "Total Sales",
      value: sales,
      icon: <CreditCard size={24} />,
      change: "+18%",
      color: "bg-amber-100 text-amber-600",
      border: "border-l-4 border-amber-400",
    },
    {
      name: "Total Revenue",
      value: `$${revenue.toLocaleString()}`,
      icon: <DollarSign size={24} />,
      change: "+15%",
      color: "bg-emerald-100 text-emerald-600",
      border: "border-l-4 border-emerald-400",
    },
    {
      name: "Bookings",
      value: booking,
      icon: <Calendar size={24} />,
      change: "-3%",
      color: "bg-rose-100 text-rose-600",
      border: "border-l-4 border-rose-400",
    },
  ];

  const pieData = [
    { name: "Completed", value: bookingCompleted, color: "#58C5A0" },
    { name: "Pending", value: bookingPending, color: "#FF8901" },
    { name: "Rejected", value: bookingRejected, color: "#E63946" },
  ];
  const statusColors = {
    Completed: "bg-green-100 text-green-800",
    Pending: "bg-amber-100 text-amber-800",
    Refunded: "bg-rose-100 text-rose-800",
  };
  // Added notification popup Funcationalty
  const openNotifModal = (notif) => {
    Swal.fire({
      title: notif?.title ?? "Details",
      text: notif?.message ?? "No description available.",
      icon: "info",
      confirmButtonText: "Close",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh]">
        <HashLoader color="#84CF16" />
        <span className="ml-4 text-gray-500 mt-4">
          Loading dashboard data...
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 w-full bg-gray-50 min-h-screen">
      {/* Updated Header - Replaced Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-2 mb-2">
            {getGreetingIcon()}
            <h1 className="text-2xl font-bold text-newPrimary">
              {getGreeting()}, {userInfo?.name || "Admin"}!
            </h1>
          </div>
          <p className="text-gray-600">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-gradient-to-r from-newPrimary/10 to-green-100/30 p-4 rounded-xl border border-newPrimary/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-newPrimary">{sales}</div>
            <div className="text-xs text-gray-600">Today's Sales</div>
          </div>
          <div className="h-8 w-px bg-newPrimary/30 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-newPrimary">
              ${revenue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Revenue</div>
          </div>
          <div className="h-8 w-px bg-newPrimary/30 hidden sm:block"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-newPrimary">
              {bookingPending}
            </div>
            <div className="text-xs text-gray-600"> Orders</div>
          </div>

          {/* Notification Bell */}
          <div className="h-8 w-px bg-newPrimary/30 hidden sm:block"></div>
          <div className="relative" ref={dropdownRef}>
            <button
              className="relative p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(!open)}
            >
              <Bell size={20} className="text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="flex justify-between items-center p-2 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">
                      No new notifications
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className="flex justify-between items-start p-3 border-b hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-gray-600">
                            {notif.message}
                          </p>
                        </div>
                        <div className="">
                          <button
                            onClick={() => openNotifModal(notif)}
                            className="p-1 hover:text-blue-600"
                          >
                            <ExternalLink size={12} className="text-primary" />
                          </button>
                          <button
                            onClick={() => clearNotification(notif._id)}
                            className="ml-2 text-gray-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {summaryData.map((item, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${item.border}`}
            style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s both` }}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg ${item.color}`}>{item.icon}</div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {item.change}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-800">
                {item.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{item.name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          style={{ animation: "slideInLeft 0.5s ease-out" }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">
              Sales Overview
            </h2>
            <div className="flex space-x-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => 
                    fetchSalesChart("weekly")}
                  className={`px-3 py-1 text-xs rounded-full ${
                    activePeriod === "weekly"
                      ? "bg-newPrimary/10 text-newPrimary"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Weekly
                </button>

                <button
                  onClick={() => 
                    fetchSalesChart("monthly")}
                  className={`px-3 py-1 text-xs rounded-full ${
                    activePeriod === "monthly"
                      ? "bg-newPrimary/10 text-newPrimary"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Monthly
                </button>

                <button
                  onClick={() => 
                    fetchSalesChart("yearly")}
                  className={`px-3 py-1 text-xs rounded-full ${
                    activePeriod === "yearly"
                      ? "bg-newPrimary/10 text-newPrimary"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  chartData.length > 0
                    ? chartData
                    : [{ name: "No data", sales: 0, revenue: 0 }]
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="sales"
                  name="Number of Sales"
                  fill="#84CF16"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue ($)"
                  stroke="#58C5A0"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          style={{ animation: "slideInRight 0.5s ease-out" }}
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Order Status
          </h2>
          <div className="flex justify-center items-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8"
        style={{ animation: "fadeIn 0.5s ease-out" }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Booking Customers
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Customer Name</TableHead>
                <TableHead className="w-[120px]">Mobile No.</TableHead>
                <TableHead className="w-[250px]">Address</TableHead>
                <TableHead className="w-[300px]">Items</TableHead>
                <TableHead className="w-[100px]">Total</TableHead>
                <TableHead className="w-[140px]">Payment Method</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCustomer.map((transaction, index) => (
                <TableRow
                  key={transaction.id}
                  style={{
                    animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <TableCell className="font-medium">
                    {transaction.customerName}
                  </TableCell>
                  <TableCell>{transaction.mobileNo}</TableCell>
                  <TableCell className="whitespace-normal break-words">
                    {transaction.address}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    {transaction.items.map((item) => item.itemName).join(", ")}
                  </TableCell>
                  <TableCell>Rs.{transaction.total}</TableCell>
                  <TableCell>{transaction.paymentMethod}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        statusColors[transaction.status]
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {recentCustomer.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No recent transactions found.
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
