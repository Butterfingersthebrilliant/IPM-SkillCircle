import { Link } from "react-router-dom";
import { Clock, MapPin, DollarSign, Heart, Briefcase, BookOpen } from "lucide-react";

const CATEGORY_ICONS = {
    Skills: Briefcase,
    Hobbies: Heart,
    Academics: BookOpen
};

const CATEGORY_COLORS = {
    Skills: "bg-blue-100 text-blue-800",
    Hobbies: "bg-pink-100 text-pink-800",
    Academics: "bg-green-100 text-green-800"
};

export default function ServiceCard({ service }) {
    const Icon = CATEGORY_ICONS[service.category] || Briefcase;

    return (
        <Link to={`/service/${service.id}`} className="block group">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="p-5 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[service.category] || "bg-slate-100 text-slate-800"}`}>
                            {service.category}
                        </span>
                        <span className="text-xs text-slate-500">
                            {new Date(service.createdAt?.seconds * 1000).toLocaleDateString()}
                        </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">
                        {service.title}
                    </h3>

                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                        {service.shortDescription}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {service.tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                    <div className="flex items-center text-slate-600">
                        {service.compensationType === "cash" && <DollarSign className="h-4 w-4 mr-1" />}
                        {service.compensationType === "barter" && <span className="font-bold mr-1">⇄</span>}
                        {service.compensationType === "pro_bono" && <Heart className="h-4 w-4 mr-1" />}
                        <span className="capitalize">{service.compensationType.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center text-slate-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="capitalize">{service.deliveryMode}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
