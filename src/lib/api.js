// API Client to replace Firestore
// This file keeps the same function signatures so we don't have to rewrite all components

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000/api";

function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}

// --- Users ---

export async function syncUser(user) {
    if (!user) return;

    try {
        const response = await fetch(`${API_URL}/users/sync`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            })
        });
        return await response.json();
    } catch (error) {
        console.error("Error syncing user:", error);
    }
}

export async function getUserProfile(uid) {
    const response = await fetch(`${API_URL}/users/${uid}`, {
        headers: getHeaders()
    });
    if (!response.ok) return null;
    return await response.json();
}

export async function updateUserProfile(uid, data) {
    const response = await fetch(`${API_URL}/users/${uid}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to update profile");
    return await response.json();
}

export async function uploadProfilePhoto(uid, file) {
    const formData = new FormData();
    formData.append('photo', file);

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/users/${uid}/photo`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) throw new Error("Failed to upload photo");
    return await response.json();
}

export async function getUsers() {
    const response = await fetch(`${API_URL}/users`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
}

export async function toggleUserBlacklist(uid, isBlacklisted) {
    const response = await fetch(`${API_URL}/users/${uid}/blacklist`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ isBlacklisted })
    });
    if (!response.ok) throw new Error("Failed to update blacklist status");
    return await response.json();
}

// --- Services ---

export async function createService(serviceData) {
    const response = await fetch(`${API_URL}/services`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(serviceData)
    });
    if (!response.ok) throw new Error("Failed to create service");
    const data = await response.json();
    return data.id;
}

export async function getServices(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.providerUid) params.append("providerUid", filters.providerUid);

    if (filters.status === 'all') {
        // Do not append status param to get all records
    } else if (!filters.status) {
        params.append("status", "approved");
    } else {
        params.append("status", filters.status);
    }

    const response = await fetch(`${API_URL}/services?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch services");
    return await response.json();
}

export async function getService(id) {
    const response = await fetch(`${API_URL}/services/${id}`);
    if (!response.ok) return null;
    return await response.json();
}

export async function updateService(id, data) {
    // Not fully implemented generic update in backend yet
}

export async function deleteService(id) {
    const response = await fetch(`${API_URL}/services/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete service");
    return await response.json();
}

export async function getPendingServices() {
    const response = await fetch(`${API_URL}/services?status=pending`);
    if (!response.ok) throw new Error("Failed to fetch pending services");
    return await response.json();
}

export async function updateServiceStatus(id, status, reason = "") {
    const response = await fetch(`${API_URL}/services/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status, reason })
    });
    if (!response.ok) throw new Error("Failed to update status");
}

// --- Requests ---

export async function createRequest(requestData) {
    const response = await fetch(`${API_URL}/requests`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(requestData)
    });
    if (!response.ok) throw new Error("Failed to create request");
}

export async function getRequest(id) {
    const response = await fetch(`${API_URL}/requests/${id}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch request");
    return await response.json();
}

// --- Notifications ---

export async function getNotifications() {
    const response = await fetch(`${API_URL}/notifications`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return await response.json();
}

export async function markNotificationRead(id) {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
}

// --- Messaging ---

export async function getMessages(otherUid) {
    const response = await fetch(`${API_URL}/messages/${otherUid}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch messages");
    return await response.json();
}

export async function sendMessage(messageData) {
    const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(messageData)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Send message failed:", errorData);
        throw new Error(errorData.details || "Failed to send message");
    }
    return await response.json();
}

export async function getConversations() {
    const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return await response.json();
}

export async function getUnreadMessageCount() {
    const response = await fetch(`${API_URL}/messages/unread-count`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch unread count");
    return await response.json();
}

export async function markMessagesRead(otherUid) {
    const response = await fetch(`${API_URL}/messages/${otherUid}/read`, {
        method: "PATCH",
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to mark messages as read");
    return await response.json();
}
