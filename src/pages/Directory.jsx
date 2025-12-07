import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getServices } from "../lib/api";
import ServiceCard from "../components/ServiceCard";
import { Search, Filter } from "lucide-react";

export default function Directory() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const categoryFilter = searchParams.get("category") || "All";

    useEffect(() => {
        async function fetchServices() {
            setLoading(true);
            try {
                const filters = {};
                if (categoryFilter !== "All") {
                    filters.category = categoryFilter;
                }
                const data = await getServices(filters);
                setServices(data);
            } catch (error) {
                console.error("Failed to fetch services", error);
            } finally {
                setLoading(false);
            }
        }

        fetchServices();
    }, [categoryFilter]);

    const handleCategoryChange = (category) => {
        if (category === "All") {
            searchParams.delete("category");
        } else {
            searchParams.set("category", category);
        }
        setSearchParams(searchParams);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Service Directory</h1>

                {/* Filters */}
                <div className="mt-4 md:mt-0 flex space-x-2 overflow-x-auto pb-2 md:pb-0">
                    {["All", "Skills", "Hobbies", "Academics"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === cat
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar (Visual only for now, or client-side filter) */}
            <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search services by title or tags..."
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 h-64 animate-pulse" />
                    ))}
                </div>
            ) : services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
                    <Filter className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No services found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Try adjusting your filters or check back later.
                    </p>
                </div>
            )}
        </div>
    );
}
