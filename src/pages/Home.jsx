import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight, BookOpen, Heart, Briefcase } from "lucide-react";
import { getServices } from "../lib/api";
import ServiceCard from "../components/ServiceCard";

export default function Home() {
    const { currentUser } = useAuth();
    const [latestServices, setLatestServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchServices() {
            try {
                const services = await getServices({ limit: 4 });
                setLatestServices(services);
            } catch (error) {
                console.error("Failed to fetch services", error);
            } finally {
                setLoading(false);
            }
        }

        fetchServices();
    }, []);

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <div className="relative bg-indigo-800 text-white overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        className="w-full h-full object-cover opacity-20"
                        src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                        alt="Students studying"
                    />
                    <div className="absolute inset-0 bg-indigo-900 mix-blend-multiply" />
                </div>
                <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                        IPM Student Services Hub
                    </h1>
                    <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
                        The exclusive marketplace for IPM IIM Indore students. Exchange skills, find hobby partners, and get academic help from your peers.
                    </p>
                    <div className="mt-10 flex space-x-4">
                        <Link
                            to="/directory"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                        >
                            Browse Services
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        {!currentUser ? (
                            <button
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 bg-opacity-60 hover:bg-opacity-70"
                            >
                                Sign In to Join
                            </button>
                        ) : (
                            <Link
                                to="/profile"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Customize Profile
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-8">Explore Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Skills */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Skills</h3>
                        <p className="text-slate-500 mb-4">
                            Design, coding, writing, and professional services offered by peers.
                        </p>
                        <Link to="/directory?category=Skills" className="text-blue-600 font-medium hover:text-blue-700">
                            View Skills &rarr;
                        </Link>
                    </div>

                    {/* Hobbies */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                            <Heart className="h-6 w-6 text-pink-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Hobbies</h3>
                        <p className="text-slate-500 mb-4">
                            Find partners for music, sports, art, and other recreational activities.
                        </p>
                        <Link to="/directory?category=Hobbies" className="text-pink-600 font-medium hover:text-pink-700">
                            View Hobbies &rarr;
                        </Link>
                    </div>

                    {/* Academics */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <BookOpen className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Academics</h3>
                        <p className="text-slate-500 mb-4">
                            Tutoring, study groups, and academic assistance for your courses.
                        </p>
                        <Link to="/directory?category=Academics" className="text-green-600 font-medium hover:text-green-700">
                            View Academics &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            {/* Latest Services Section */}
            <div className="bg-slate-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-slate-900">Latest Services</h2>
                        <Link to="/directory" className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center">
                            View All <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : latestServices.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {latestServices.map((service) => (
                                <ServiceCard key={service.id} service={service} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-slate-500">No services found yet. Be the first to post!</p>
                            {currentUser && (
                                <Link to="/create-listing" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-700">
                                    Create a Listing &rarr;
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
