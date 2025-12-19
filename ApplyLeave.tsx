import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { AlertCircle, Calendar, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function ApplyLeave() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const createRequestMutation = trpc.leaveRequests.create.useMutation();

  // Calculate days between dates
  const calculateDays = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = startDate && endDate ? calculateDays(startDate, endDate) : 0;

  // Check if date is in range
  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  // Check if date is start or end
  const isStartOrEndDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const startStr = startDate?.toISOString().split("T")[0];
    const endStr = endDate?.toISOString().split("T")[0];
    return dateStr === startStr || dateStr === endStr;
  };

  const handleDateClick = (date: Date) => {
    if (!startDate) {
      setStartDate(date);
      setEndDate(null);
    } else if (!endDate) {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    } else {
      // Reset and start new selection
      setStartDate(date);
      setEndDate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (daysCount > (user?.leaveBalance || 0)) {
      toast.error(`Insufficient leave balance. You have ${user?.leaveBalance} days available but need ${daysCount} days.`);
      return;
    }

    try {
      await createRequestMutation.mutateAsync({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        reason: reason || undefined,
      });

      setSubmitted(true);
      setTimeout(() => {
        setLocation("/staff/dashboard");
      }, 2000);
    } catch (error) {
      toast.error("Failed to submit leave request");
      console.error(error);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Request Submitted!</h2>
                <p className="text-gray-600">
                  Your leave request has been submitted successfully. Your supervisor will review it shortly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Apply for Leave</CardTitle>
            <CardDescription>Select your leave dates (like booking a hotel)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Calendar Section */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    {startDate && endDate ? (
                      <>
                        <span className="text-blue-600 font-semibold">
                          {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                        </span>
                        <span className="ml-2 text-gray-600">({daysCount} days)</span>
                      </>
                    ) : startDate ? (
                      <>
                        <span className="text-blue-600 font-semibold">Start: {startDate.toLocaleDateString()}</span>
                        <span className="ml-2 text-gray-500">← Select end date</span>
                      </>
                    ) : (
                      <span className="text-gray-600">Click on a date to start selecting your leave period</span>
                    )}
                  </p>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold">{monthName}</h3>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Day headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {days.map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }

                    const isToday = date.toDateString() === new Date().toDateString();
                    const inRange = isDateInRange(date);
                    const isStartEnd = isStartOrEndDate(date);
                    const isPast = date < new Date() && !isToday;

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => !isPast && handleDateClick(date)}
                        disabled={isPast}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                          transition-colors duration-200
                          ${isPast ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "cursor-pointer"}
                          ${isStartEnd ? "bg-blue-600 text-white font-bold" : ""}
                          ${inRange && !isStartEnd ? "bg-blue-100 text-blue-900" : ""}
                          ${!inRange && !isPast && !isStartEnd ? "bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50" : ""}
                          ${isToday && !inRange && !isStartEnd ? "border-2 border-orange-400" : ""}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-4 text-xs mt-4 p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span>Selected dates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded"></div>
                    <span>In range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-400 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                    <span>Past dates</span>
                  </div>
                </div>
              </div>

              {/* Leave Balance Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900">Leave Balance: {user?.leaveBalance} days</p>
                    {daysCount > 0 && (
                      <p className="text-amber-800 mt-1">
                        {daysCount > (user?.leaveBalance || 0)
                          ? `You need ${daysCount} days but only have ${user?.leaveBalance} available`
                          : `You will have ${(user?.leaveBalance || 0) - daysCount} days remaining after this request`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason Field */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="E.g., Vacation, Medical appointment, Family event..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-24"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/staff/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!startDate || !endDate || createRequestMutation.isPending}
                  className="flex-1"
                >
                  {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
