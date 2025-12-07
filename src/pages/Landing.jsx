import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Shield, Users, Zap } from "lucide-react";

export default function Landing() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-y-0 h-full w-full aria-hidden=true">
                    <div className="relative h-full">
                        <svg
                            className="absolute right-full transform translate-y-1/3 translate-x-1/4 md:translate-y-1/2 sm:translate-x-1/2 lg:translate-x-full"
                            width={404}
                            height={784}
                            fill="none"
                            viewBox="0 0 404 784"
                        >
                            <defs>
                                <pattern
                                    id="e229dbec-10e9-49ee-8ec3-0286ca089edf"
                                    x={0}
                                    y={0}
                                    width={20}
                                    height={20}
                                    patternUnits="userSpaceOnUse"
                                >
                                    <rect x={0} y={0} width={4} height={4} className="text-slate-200" fill="currentColor" />
                                </pattern>
                            </defs>
                            <rect width={404} height={784} fill="url(#e229dbec-10e9-49ee-8ec3-0286ca089edf)" />
                        </svg>
                        <svg
                            className="absolute left-full transform -translate-y-3/4 -translate-x-1/4 sm:-translate-x-1/2 md:-translate-y-1/2 lg:-translate-x-3/4"
                            width={404}
                            height={784}
                            fill="none"
                            viewBox="0 0 404 784"
                        >
                            <defs>
                                <pattern
                                    id="d2a68204-c383-44b1-b99f-42ccff4e5365"
                                    x={0}
                                    y={0}
                                    width={20}
                                    height={20}
                                    patternUnits="userSpaceOnUse"
                                >
                                    <rect x={0} y={0} width={4} height={4} className="text-slate-200" fill="currentColor" />
                                </pattern>
                            </defs>
                            <rect width={404} height={784} fill="url(#d2a68204-c383-44b1-b99f-42ccff4e5365)" />
                        </svg>
                    </div>
                </div>

                <div className="relative pt-6 pb-16 sm:pb-24">
                    <main className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6">
                        <div className="text-center">
                            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
                                <span className="block">Unlock your potential with</span>
                                <span className="block text-indigo-600">IPM SkillCircle</span>
                            </h1>
                            <p className="mt-3 max-w-md mx-auto text-base text-slate-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                                The exclusive platform for IPM students to share skills, find mentors, and collaborate on projects. Verified, secure, and built for our community.
                            </p>
                            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                                <div className="rounded-md shadow">
                                    <Link
                                        to="/signup"
                                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                                    <Link
                                        to="/login"
                                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-slate-50 md:py-4 md:text-lg md:px-10"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Feature Section */}
            <div className="py-12 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Everything you need to grow
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-slate-500 lg:mx-auto">
                            Connect with peers, offer your expertise, and request help for your projects.
                        </p>
                    </div>

                    <div className="mt-10">
                        <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                        <Shield className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-slate-900">Verified Community</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-slate-500">
                                    Exclusive to @iimidr.ac.in email holders. Connect with trusted peers from your batch and seniors.
                                </dd>
                            </div>

                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                        <Users className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-slate-900">Skill Exchange</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-slate-500">
                                    Offer services like tutoring, design, or coding. Find the help you need for your next big project.
                                </dd>
                            </div>

                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                        <Zap className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-slate-900">Fast & Secure</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-slate-500">
                                    Built with modern tech for a seamless experience. Your data is secure and your interactions are private.
                                </dd>
                            </div>

                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                        <CheckCircle className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <p className="ml-16 text-lg leading-6 font-medium text-slate-900">Easy Management</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base text-slate-500">
                                    Manage your listings, track requests, and update your profile with ease.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
