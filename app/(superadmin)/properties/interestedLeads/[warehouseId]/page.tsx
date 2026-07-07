"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  Badge,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InterestedLead {
  id: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string;
  status: string;
  created_at: string;
}

export default function InterestedLeadsPage() {
  const router = useRouter();
  const params = useParams();

  const warehouseId = params.warehouseId as string;

  const [loading, setLoading] = useState(true);
  const [propertyName, setPropertyName] = useState("");
  const [leads, setLeads] = useState<InterestedLead[]>([]);
  useEffect(() => {
    fetchInterestedLeads();
  }, []);

  async function fetchInterestedLeads() {
    try {
      const res = await fetch(
        `/api/superadmin/warehouses/${warehouseId}/interestedLeads`
      );

      const data = await res.json();

      if (data.success) {
        setPropertyName(data.property?.title ?? "");
        setLeads(data.leads ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <Button
            variant="ghost"
            className="mb-2 pl-0 h-12 px-3 text-base font-medium"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back
          </Button>
        </div>

        <div className="bg-white border rounded-xl px-4 py-1 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Leads
          </p>

          <h2 className="text-center font-bold text-brand-teal-deep">
            {leads.length}
          </h2>
        </div>

      </div>

      {/* Table */}
      <div className="flex-1 bg-white border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-brand-teal/15">
              <TableHead className="font-bold text-[#0F5C66] bg-brand-teal/15">
                Lead
              </TableHead>
              <TableHead className="font-bold text-[#0F5C66] bg-brand-teal/15">
                Email
              </TableHead>
              <TableHead className="font-bold text-[#0F5C66] bg-brand-teal/15">
                Phone
              </TableHead>
              {/* <TableHead className="font-bold text-[#0F5C66] bg-brand-teal/15">
                Status
              </TableHead> */}
              <TableHead className="font-bold  text-[#0F5C66] bg-brand-teal/15">
                Interested On
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-20 text-gray-500"
                >
                  No interested leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="hover:bg-brand-teal/10"
                >
                  {/* Lead */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-teal/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-teal-medium" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {lead.lead_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {/* Email */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {lead.lead_email}
                    </div>
                  </TableCell>
                  {/* Phone */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {lead.lead_phone || "-"}
                    </div>
                  </TableCell>
                  {/* Status */}
                  {/* <TableCell>
                    <Badge
                      className="bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      {lead.status}
                    </Badge>
  
                  </TableCell> */}

                  {/* Date */}

                  <TableCell>
                    {new Date(lead.created_at).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}

                  </TableCell>
                </TableRow>
              ))
            )}

          </TableBody>
        </Table>
      </div>
    </div>
  );
}