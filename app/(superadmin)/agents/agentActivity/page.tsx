"use client";

import { useEffect, useState } from "react";

interface Activity {
    id: string;
    full_name: string;
    email: string;
    updated_at: string;
}

export default function AgentActivityPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const res = await fetch("/api/agents/recent-activity");
            const data = await res.json();

            if (data.success) {
                console.log(data.data.totalActivities, "r32r2")
                setActivities(data.data.totalActivities);
            }
        } catch (error) {
            console.error("Failed to fetch activities", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="p-6">Loading...</p>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Agent Activity</h1>

            <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left p-3">Agent</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-left p-3">Last Login</th>
                        </tr>
                    </thead>

                    <tbody>
                        {activities.map((activity) => (
                            <tr key={activity.id} className="border-t">
                                <td className="p-3">{activity.full_name}</td>
                                <td className="p-3">{activity.email}</td>
                                <td className="p-3">
                                    {new Date(activity.updated_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}