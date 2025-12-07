import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPendingServices, updateServiceStatus, getServices, deleteService, getUsers, toggleUserBlacklist } from "../lib/api";
import { Check, X, Trash2, Ban, UserCheck, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Admin() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState("pending");
    const [pendingServices, setPendingServices] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab === "pending") fetchPending();
        if (activeTab === "listings") fetchAllListings();
        if (activeTab === "users") fetchUsers();
    }, [currentUser, activeTab]);

    async function fetchPending() {
        setLoading(true);
        try {
            const data = await getPendingServices();
            setPendingServices(data);
        } catch (error) {
            console.error("Failed to fetch pending services", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchAllListings() {
        setLoading(true);
        try {
            const data = await getServices({ status: 'all' });
            setAllServices(data);
        } catch (error) {
            console.error("Failed to fetch all services", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchUsers() {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    }

    const handleModeration = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this listing?`)) return;
        try {
            await updateServiceStatus(id, status);
            setPendingServices(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error(`Failed to ${status} service`, error);
            alert(`Failed to ${status} service`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to DELETE this listing? This cannot be undone.")) return;
        try {
            await deleteService(id);
            setAllServices(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error("Failed to delete service", error);
            alert("Failed to delete service");
        }
    };

    const handleBlacklist = async (uid, currentStatus) => {
        const action = currentStatus ? "Unblacklist" : "Blacklist";
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await toggleUserBlacklist(uid, !currentStatus);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, is_blacklisted: !currentStatus } : u));
        } catch (error) {
            console.error(`Failed to ${action} user`, error);
            alert(`Failed to ${action} user`);
        }
    };

    if (!currentUser) return <div className="p-8">Access Denied</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`${activeTab === "pending"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Pending Approvals
                    </button>
                    <button
                        onClick={() => setActiveTab("listings")}
                        className={`${activeTab === "listings"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        All Listings
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`${activeTab === "users"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        User Management
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : (
                    <>
                        {activeTab === "pending" && (
                            <ul className="divide-y divide-slate-200">
                                {pendingServices.length > 0 ? pendingServices.map((service) => (
                                    <li key={service.id} className="p-4 hover:bg-slate-50">
                                        <div className="flex flex-col sm:flex-row sm:justify-between">
                                            <div className="mb-4 sm:mb-0">
                                                <h4 className="text-lg font-bold text-indigo-600">{service.title}</h4>
                                                <p className="text-sm text-slate-600">Provider: {service.providerName}</p>
                                                <p className="text-sm text-slate-500">Posted: {new Date(service.createdAt?.seconds * 1000).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Link to={`/service/${service.id}`} target="_blank" className="text-indigo-600 text-sm font-medium mr-4">View</Link>
                                                <button onClick={() => handleModeration(service.id, "approved")} className="px-3 py-1.5 rounded-md text-white bg-green-600 hover:bg-green-700 text-xs flex items-center">
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </button>
                                                <button onClick={() => handleModeration(service.id, "rejected")} className="px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 text-xs flex items-center">
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                )) : <div className="p-8 text-center text-slate-500">No pending approvals.</div>}
                            </ul>
                        )}

                        {activeTab === "listings" && (
                            <ul className="divide-y divide-slate-200">
                                {allServices.length > 0 ? allServices.map((service) => (
                                    <li key={service.id} className="p-4 hover:bg-slate-50">
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-center">
                                            <div className="mb-4 sm:mb-0 w-full">
                                                <div className="flex justify-between">
                                                    <h4 className="text-lg font-bold text-slate-900">{service.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${service.status === 'approved' ? 'bg-green-100 text-green-800' : service.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {service.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600">Provider: {service.providerName}</p>
                                            </div>
                                            <div className="flex items-center ml-4">
                                                <Link to={`/service/${service.id}`} target="_blank" className="text-indigo-600 text-sm font-medium mr-4">View</Link>
                                                <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-900 p-2">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                )) : <div className="p-8 text-center text-slate-500">No listings found.</div>}
                            </ul>
                        )}

                        {activeTab === "users" && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {users.map((user) => (
                                            <tr key={user.uid}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-slate-900">{user.display_name}</div>
                                                            <div className="text-sm text-slate-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.is_blacklisted ? (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                            Blacklisted
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleBlacklist(user.uid, user.is_blacklisted)}
                                                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ${user.is_blacklisted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                                        >
                                                            {user.is_blacklisted ? (
                                                                <>
                                                                    <UserCheck className="h-4 w-4 mr-1" /> Activate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Ban className="h-4 w-4 mr-1" /> Blacklist
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
