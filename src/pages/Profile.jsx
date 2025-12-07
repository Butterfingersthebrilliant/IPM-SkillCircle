import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Edit2, Save, X, Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getServices, updateUserProfile, getUserProfile, uploadProfilePhoto, followUser, checkFollowStatus } from "../lib/api";
import ServiceCard from "../components/ServiceCard";

export default function Profile() {
    const { uid } = useParams();
    const { currentUser, updateUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [myServices, setMyServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    const isOwnProfile = !uid || (currentUser && currentUser.uid === uid);

    // Form State
    const [formData, setFormData] = useState({
        displayName: "",
        photoURL: "",
        bio: "",
        batch: "",
        expertise: "",
        learningGoals: "",
        qualifications: ""
    });

    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            try {
                let userToLoad = null;

                if (uid) {
                    if (currentUser && uid === currentUser.uid) {
                        userToLoad = currentUser;
                    } else {
                        // Fetch other user's profile
                        const fetchedUser = await getUserProfile(uid);
                        if (fetchedUser) {
                            userToLoad = {
                                uid: fetchedUser.uid,
                                email: fetchedUser.email,
                                displayName: fetchedUser.display_name,
                                photoURL: fetchedUser.photo_url,
                                bio: fetchedUser.bio,
                                batch: fetchedUser.batch,
                                expertise: fetchedUser.expertise,
                                learningGoals: fetchedUser.learning_goals,
                                qualifications: fetchedUser.qualifications
                            };
                        }
                    }
                } else {
                    userToLoad = currentUser;
                }

                setProfileUser(userToLoad);

                if (userToLoad) {
                    setFormData({
                        displayName: userToLoad.displayName || "",
                        photoURL: userToLoad.photoURL || "",
                        bio: userToLoad.bio || "",
                        batch: userToLoad.batch || "",
                        expertise: userToLoad.expertise ? userToLoad.expertise.join(", ") : "",
                        learningGoals: userToLoad.learningGoals ? userToLoad.learningGoals.join(", ") : "",
                        qualifications: userToLoad.qualifications ? userToLoad.qualifications.join(", ") : ""
                    });

                    // Fetch services for this user
                    const services = await getServices({
                        providerUid: userToLoad.uid,
                        status: 'all'
                    });
                    setMyServices(services);

                    // Check follow status if not own profile
                    if (!isOwnProfile && currentUser) {
                        try {
                            const followData = await checkFollowStatus(userToLoad.uid);
                            setIsFollowing(followData.following);
                            setFollowerCount(followData.followerCount);
                        } catch (err) {
                            console.error("Failed to check follow status", err);
                        }
                    } else if (isOwnProfile) {
                        // For own profile, just get count (optional, or reuse endpoint)
                        try {
                            const followData = await checkFollowStatus(userToLoad.uid);
                            setFollowerCount(followData.followerCount);
                        } catch (err) {
                            console.error("Failed to check follower count", err);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        }

        if (currentUser || uid) {
            loadProfile();
        }
    }, [currentUser, uid]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Fix: Use camelCase keys to match backend expectation
            const updatedData = {
                displayName: formData.displayName,
                bio: formData.bio,
                batch: formData.batch,
                expertise: formData.expertise.split(",").map(s => s.trim()).filter(Boolean),
                learningGoals: formData.learningGoals.split(",").map(s => s.trim()).filter(Boolean),
                qualifications: formData.qualifications.split(",").map(s => s.trim()).filter(Boolean)
            };

            await updateUserProfile(currentUser.uid, updatedData);

            // Update local state
            setProfileUser(prev => ({
                ...prev,
                displayName: formData.displayName,
                bio: formData.bio,
                batch: formData.batch,
                expertise: updatedData.expertise,
                learningGoals: updatedData.learningGoals,
                qualifications: updatedData.qualifications
            }));

            // Update global auth state if it's the current user
            if (currentUser.uid === uid || !uid) {
                updateUser({ ...currentUser, ...updatedData });
            }

            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const result = await uploadProfilePhoto(currentUser.uid, file);
            setProfileUser(prev => ({ ...prev, photoURL: result.photoUrl }));
            setFormData(prev => ({ ...prev, photoURL: result.photoUrl }));

            // Update global auth state
            updateUser({ ...currentUser, photoURL: result.photoUrl });

        } catch (error) {
            console.error("Failed to upload photo", error);
            alert("Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            alert("Please sign in to follow users.");
            return;
        }
        if (!profileUser) return;
        try {
            const result = await followUser(profileUser.uid);
            setIsFollowing(result.following);
            setFollowerCount(prev => result.following ? prev + 1 : prev - 1);
        } catch (error) {
            console.error("Failed to toggle follow", error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;
    if (!profileUser) return <div className="p-8 text-center">User not found.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header / Profile Card */}
            <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
                <div className="bg-indigo-600 h-32"></div>
                <div className="px-4 py-5 sm:px-6 relative">
                    <div className="-mt-16 mb-4 flex justify-between items-end">
                        <div className="relative group">
                            <img
                                className="h-24 w-24 rounded-full ring-4 ring-white bg-white object-cover"
                                src={profileUser.photoURL || `https://ui-avatars.com/api/?name=${profileUser.email}`}
                                alt=""
                            />
                            {isEditing && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="h-8 w-8 text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                                </label>
                            )}
                        </div>
                        <div className="mb-2">
                            {isOwnProfile ? (
                                !isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                                    >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {saving ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleFollow}
                                        className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none ${isFollowing
                                            ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                                            : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                                            }`}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                    <Link
                                        to={`/messages/${profileUser.uid}`}
                                        className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                                    >
                                        Message
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="mt-4">
                        {isEditing ? (
                            <div className="space-y-4 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Batch (e.g. IPM2024)</label>
                                    <input
                                        type="text"
                                        value={formData.batch}
                                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Bio</label>
                                    <textarea
                                        rows={3}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Expertise (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.expertise}
                                        onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                                        placeholder="Web Dev, Python, Design"
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Learning Goals (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.learningGoals}
                                        onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })}
                                        placeholder="Machine Learning, Guitar, Spanish"
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Qualifications (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.qualifications}
                                        onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                                        placeholder="B.Tech, Certified Yoga Instructor"
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{profileUser.displayName}</h1>
                                <div className="flex items-center space-x-4 mb-2">
                                    <p className="text-sm text-slate-500">{profileUser.email}</p>
                                    <span className="text-sm text-slate-500">•</span>
                                    <p className="text-sm font-medium text-slate-700">{followerCount} {followerCount === 1 ? 'follower' : 'followers'}</p>
                                </div>
                                {profileUser.batch && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-4">
                                        {profileUser.batch}
                                    </span>
                                )}

                                {profileUser.bio && (
                                    <p className="text-slate-700 mt-2 max-w-2xl">{profileUser.bio}</p>
                                )}

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {profileUser.expertise && profileUser.expertise.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Expertise</h3>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {profileUser.expertise.map((item, i) => (
                                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profileUser.learningGoals && profileUser.learningGoals.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Learning Goals</h3>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {profileUser.learningGoals.map((item, i) => (
                                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {profileUser.qualifications && profileUser.qualifications.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Qualifications</h3>
                                            <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
                                                {profileUser.qualifications.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">{isOwnProfile ? "My Listings" : "Listings"}</h2>
                {isOwnProfile && (
                    <Link to="/create-listing" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Listing
                    </Link>
                )}
            </div>

            {/* My Listings */}
            <div>
                {loading ? (
                    <div className="text-slate-500">Loading...</div>
                ) : myServices.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {myServices.map((service) => (
                            <div key={service.id} className="relative group">
                                <ServiceCard service={service} />
                                <div className="absolute top-2 right-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        service.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-dashed border-slate-300 p-8 text-center">
                        <p className="text-slate-500 mb-4">{isOwnProfile ? "You haven't posted any services yet." : "This user hasn't posted any services yet."}</p>
                        {isOwnProfile && (
                            <Link to="/create-listing" className="text-indigo-600 font-medium hover:text-indigo-700">
                                Create your first listing &rarr;
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
