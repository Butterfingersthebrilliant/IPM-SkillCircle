import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getService, createRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { Clock, MapPin, DollarSign, Heart, User, ArrowLeft, CheckCircle, MessageCircle } from "lucide-react";

export default function ServiceDetail() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { openChat } = useChat();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestSent, setRequestSent] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");

    useEffect(() => {
        async function fetchService() {
            try {
                const data = await getService(id);
                setService(data);
            } catch (error) {
                console.error("Failed to fetch service", error);
            } finally {
                setLoading(false);
            }
        }
        fetchService();
    }, [id]);

    const handleRequest = async (e) => {
        e.preventDefault();
        if (!currentUser) return; // Should be guarded by AuthGuard anyway if we enforce it on button

        try {
            await createRequest({
                serviceId: id,
                seekerUid: currentUser.uid,
                seekerName: currentUser.displayName,
                seekerEmail: currentUser.email,
                providerUid: service.providerUid,
                message: requestMessage,
                status: "pending"
            });
            setRequestSent(true);
        } catch (error) {
            console.error("Failed to send request", error);
            alert("Failed to send request. Please try again.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!service) return <div className="p-8 text-center">Service not found.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/directory" className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Directory
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">{service.title}</h1>
                                    <div className="mt-2 flex items-center text-sm text-slate-500">
                                        <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full text-xs font-medium mr-2">
                                            {service.category}
                                        </span>
                                        <span>Posted on {new Date(service.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-slate-200 px-4 py-5 sm:px-6">
                            <div className="prose prose-indigo max-w-none text-slate-700">
                                <p className="text-lg font-medium mb-4">{service.shortDescription}</p>
                                <div className="whitespace-pre-wrap">{service.longDescription || "No detailed description provided."}</div>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-2">
                                {service.tags?.map(tag => (
                                    <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Provider Card */}
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-slate-900 mb-4">About the Provider</h3>
                        <Link to={`/profile/${service.providerUid}`} className="flex items-center hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2">
                            <img
                                className="h-12 w-12 rounded-full bg-slate-100"
                                src={service.providerPhoto || `https://ui-avatars.com/api/?name=${service.providerName || "User"}`}
                                alt=""
                            />
                            <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900 hover:text-indigo-600">{service.providerName || "Anonymous"}</div>
                                <div className="text-sm text-slate-500">IPM Student</div>
                            </div>
                        </Link>

                        {currentUser && currentUser.uid !== service.providerUid && (
                            <button
                                onClick={() => openChat({
                                    uid: service.providerUid,
                                    displayName: service.providerName,
                                    photoUrl: service.providerPhoto
                                })}
                                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Chat with Provider
                            </button>
                        )}
                    </div>

                    {/* Action Card */}
                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-slate-700 mb-2">
                                <span className="flex items-center"><DollarSign className="h-4 w-4 mr-2" /> Compensation</span>
                                <span className="font-medium capitalize">{service.compensationType.replace("_", " ")}</span>
                            </div>
                            {service.price && (
                                <div className="flex items-center justify-between text-slate-700 mb-2">
                                    <span className="flex items-center"><Clock className="h-4 w-4 mr-2" /> Price</span>
                                    <span className="font-medium">₹{service.price}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-slate-700">
                                <span className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> Mode</span>
                                <span className="font-medium capitalize">{service.deliveryMode}</span>
                            </div>
                        </div>

                        {currentUser ? (
                            currentUser.uid !== service.providerUid ? (
                                !requestSent ? (
                                    <form onSubmit={handleRequest}>
                                        <textarea
                                            required
                                            className="w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-4"
                                            rows={3}
                                            placeholder="Hi, I'm interested in this service..."
                                            value={requestMessage}
                                            onChange={(e) => setRequestMessage(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Request Service
                                        </button>
                                    </form>
                                ) : (
                                    <div className="rounded-md bg-green-50 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-green-800">Request Sent!</h3>
                                                <div className="mt-2 text-sm text-green-700">
                                                    <p>The provider has been notified.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-slate-500 text-sm">
                                    This is your listing.
                                </div>
                            )
                        ) : (
                            <div className="text-center">
                                <p className="text-sm text-slate-500 mb-4">Sign in to request this service.</p>
                                <div className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 opacity-50 cursor-not-allowed">
                                    Sign In Required
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
