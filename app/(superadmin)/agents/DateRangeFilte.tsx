"use client";

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parse } from 'date-fns';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateFilterProps {
  onApply: (dateRange: DateRange) => void;
  onClear: () => void;
  isActive: boolean;
}

export function DateRangeFilter({ onApply, onClear, isActive }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [activeTab, setActiveTab] = useState('quick');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const today = new Date();
  
  const quickFilters = [
    {
      label: 'Today',
      value: 'today',
      getRange: () => ({ from: startOfDay(today), to: endOfDay(today) }),
    },
    {
      label: 'This Week',
      value: 'week',
      getRange: () => ({ from: startOfWeek(today), to: endOfWeek(today) }),
    },
    {
      label: 'This Month',
      value: 'month',
      getRange: () => ({ from: startOfMonth(today), to: endOfMonth(today) }),
    },
    {
      label: 'Last 7 Days',
      value: 'last7',
      getRange: () => {
        const from = new Date(today);
        from.setDate(from.getDate() - 7);
        return { from: startOfDay(from), to: endOfDay(today) };
      },
    },
    {
      label: 'Last 30 Days',
      value: 'last30',
      getRange: () => {
        const from = new Date(today);
        from.setDate(from.getDate() - 30);
        return { from: startOfDay(from), to: endOfDay(today) };
      },
    },
  ];

  const handleQuickFilter = (range: DateRange) => {
    setSelectedRange(range);
    setFromDate(range.from ? format(range.from, 'yyyy-MM-dd') : '');
    setToDate(range.to ? format(range.to, 'yyyy-MM-dd') : '');
  };

  const handleApply = () => {
    if (selectedRange.from && selectedRange.to) {
      onApply(selectedRange);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedRange({ from: undefined, to: undefined });
    setFromDate('');
    setToDate('');
    onClear();
    setIsOpen(false);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (value) {
      const date = parse(value, 'yyyy-MM-dd', new Date());
      setSelectedRange(prev => ({ ...prev, from: date }));
    }
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    if (value) {
      const date = parse(value, 'yyyy-MM-dd', new Date());
      setSelectedRange(prev => ({ ...prev, to: date }));
    }
  };

  const isValid = selectedRange.from && selectedRange.to;
  const displayText = selectedRange.from && selectedRange.to 
    ? `${format(selectedRange.from, 'MMM d')} - ${format(selectedRange.to, 'MMM d, yyyy')}`
    : 'Select date range';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? "default" : "outline"}
          className={`w-full md:w-auto gap-2 ${
            isActive 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white' 
              : 'bg-white/50 border-white/60 hover:bg-white hover:border-cyan-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">{displayText}</span>
          <span className="sm:hidden">📅</span>
          {isActive && <X className="w-4 h-4 ml-1" onClick={(e) => { e.stopPropagation(); handleClear(); }} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-[600px] p-0 bg-white border-gray-200" align="start">
        <div className="flex flex-col md:flex-row">
          {/* Quick Filters */}
          <div className="w-full md:w-48 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Quick Filters</h3>
            <div className="space-y-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickFilter(filter.getRange())}
                  className="w-full justify-start text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Picker */}
          <div className="flex-1 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 mb-4">
                <TabsTrigger value="quick" className="text-sm">Quick Range</TabsTrigger>
                <TabsTrigger value="custom" className="text-sm">Custom Dates</TabsTrigger>
              </TabsList>

              <TabsContent value="quick" className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-gray-600 font-medium mb-2">Select a quick filter</p>
                  <p className="text-xs text-gray-500">Or switch to Custom Dates for more control</p>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">From Date</label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => handleFromDateChange(e.target.value)}
                      className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">To Date</label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => handleToDateChange(e.target.value)}
                      className="border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {isValid && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-900">Selected Range</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {format(selectedRange.from!, 'EEEE, MMMM d, yyyy')} to {format(selectedRange.to!, 'EEEE, MMMM d, yyyy')}
                    </p>
                    {selectedRange.from && selectedRange.to && (
                      <p className="text-xs text-blue-600 mt-2">
                        {Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleClear}
                className="flex-1 text-gray-700"
              >
                Clear
              </Button>
              <Button
                onClick={handleApply}
                disabled={!isValid}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangeFilter;