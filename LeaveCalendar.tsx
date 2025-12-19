import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CalendarDay {
  date: Date;
  status: "available" | "full" | "pending" | "approved" | "past";
  maxSlots?: number;
  usedSlots?: number;
  tooltip?: string;
}

interface LeaveCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDates?: Date[];
  calendarData?: Record<string, CalendarDay>;
  mode?: "view" | "select";
}

export default function LeaveCalendar({
  onDateSelect,
  selectedDates = [],
  calendarData = {},
  mode = "view",
}: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "full":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "approved":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";