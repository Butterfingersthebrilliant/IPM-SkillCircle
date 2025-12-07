import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createService } from "../lib/api";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function CreateListing() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        category: "Skills",
        shortDescription: "",
        longDescription: "",
        deliveryMode: "online",
        compensationType: "cash",
        price: "",
        tags: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!formData.title || !formData.shortDescription) {
                throw new Error("Please fill in all required fields.");
            }

            const serviceData = {
                providerUid: currentUser.uid,
                providerName: currentUser.displayName,
                providerPhoto: currentUser.photoURL,
                title: formData.title,
                category: formData.category,
                shortDescription: formData.shortDescription,
                longDescription: formData.longDescription,
                deliveryMode: formData.deliveryMode,
                compensationType: formData.compensationType,
                price: formData.price ? Number(formData.price) : null,
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
                status: "pending" // Explicitly set pending
            };

            await createService(serviceData);
            navigate("/profile"); // Redirect to profile to see pending listing
        } catch (err) {
            console.error("Error creating listing:", err);
            setError(err.message || "Failed to create listing.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-indigo-50 border-b border-indigo-100">
                    <h3 className="text-lg leading-6 font-medium text-indigo-900">
                        Post a New Service
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-indigo-700">
                        Share your skills or hobbies with the IPM community.
                    </p>
                </div>

                <div className="px-4 py-5 sm:p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <p className="ml-3 text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                                Service Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="e.g., Python Tutoring for IPM 1"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                                    Category *
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="Skills">Skills</option>
                                    <option value="Hobbies">Hobbies</option>
                                    <option value="Academics">Academics</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="deliveryMode" className="block text-sm font-medium text-slate-700">
                                    Delivery Mode
                                </label>
                                <select
                                    id="deliveryMode"
                                    name="deliveryMode"
                                    value={formData.deliveryMode}
                                    onChange={handleChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="online">Online</option>
                                    <option value="offline">Offline (Campus)</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="shortDescription" className="block text-sm font-medium text-slate-700">
                                Short Description * (appears on card)
                            </label>
                            <textarea
                                id="shortDescription"
                                name="shortDescription"
                                rows={2}
                                required
                                value={formData.shortDescription}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Brief summary of what you offer..."
                            />
                        </div>

                        <div>
                            <label htmlFor="longDescription" className="block text-sm font-medium text-slate-700">
                                Detailed Description
                            </label>
                            <textarea
                                id="longDescription"
                                name="longDescription"
                                rows={4}
                                value={formData.longDescription}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Full details, prerequisites, schedule availability, etc."
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="compensationType" className="block text-sm font-medium text-slate-700">
                                    Compensation Type
                                </label>
                                <select
                                    id="compensationType"
                                    name="compensationType"
                                    value={formData.compensationType}
                                    onChange={handleChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="cash">Cash (Hourly/Package)</option>
                                    <option value="barter">Barter / Exchange</option>
                                    <option value="pro_bono">Pro Bono (Free)</option>
                                </select>
                            </div>

                            {formData.compensationType === "cash" && (
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-slate-700">
                                        Amount (₹)
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500 sm:text-sm">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="price"
                                            id="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-slate-300 rounded-md"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-slate-700">
                                Tags (comma separated)
                            </label>
                            <input
                                type="text"
                                name="tags"
                                id="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="python, coding, beginner"
                            />
                        </div>

                        <div className="pt-5">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? "Submitting..." : "Submit for Approval"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
