import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Calendar, DollarSign, Users } from "lucide-react";

interface CampSession {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  price_amount: string;
  price_unit: 'day' | 'week';
  min_age_months: string;
  max_age_months: string;
  capacity: string;
}

interface SessionRepeaterProps {
  sessions: CampSession[];
  onChange: (sessions: CampSession[]) => void;
  className?: string;
}

export function SessionRepeater({
  sessions = [],
  onChange,
  className
}: SessionRepeaterProps) {
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  const addSession = () => {
    const newSession: CampSession = {
      id: crypto.randomUUID(),
      name: '',
      start_date: '',
      end_date: '',
      price_amount: '',
      price_unit: 'week',
      min_age_months: '',
      max_age_months: '',
      capacity: ''
    };
    onChange([...sessions, newSession]);
  };

  const removeSession = (index: number) => {
    const newSessions = sessions.filter((_, i) => i !== index);
    onChange(newSessions);
    
    // Clear validation errors for this session
    const newErrors = { ...validationErrors };
    delete newErrors[index];
    setValidationErrors(newErrors);
  };

  const updateSession = (index: number, field: keyof CampSession, value: string) => {
    const newSessions = [...sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    onChange(newSessions);
    
    // Validate the session
    validateSession(index, newSessions[index]);
  };

  const validateSession = (index: number, session: CampSession) => {
    const errors: string[] = [];
    
    // Required fields
    if (!session.name.trim()) errors.push("Session name is required");
    if (!session.start_date) errors.push("Start date is required");
    if (!session.end_date) errors.push("End date is required");
    if (!session.price_amount) errors.push("Price is required");
    if (!session.capacity) errors.push("Capacity is required");
    
    // Date validation
    if (session.start_date && session.end_date) {
      const startDate = new Date(session.start_date);
      const endDate = new Date(session.end_date);
      if (startDate > endDate) {
        errors.push("Start date must be before end date");
      }
    }
    
    // Age validation
    if (session.min_age_months && session.max_age_months) {
      const minAge = parseInt(session.min_age_months);
      const maxAge = parseInt(session.max_age_months);
      if (minAge > maxAge) {
        errors.push("Minimum age must be less than maximum age");
      }
    }
    
    // Check for overlapping sessions
    if (session.start_date && session.end_date) {
      const sessionStart = new Date(session.start_date);
      const sessionEnd = new Date(session.end_date);
      
      const hasOverlap = sessions.some((otherSession, otherIndex) => {
        if (otherIndex === index || !otherSession.start_date || !otherSession.end_date) return false;
        
        const otherStart = new Date(otherSession.start_date);
        const otherEnd = new Date(otherSession.end_date);
        
        return (sessionStart <= otherEnd && sessionEnd >= otherStart);
      });
      
      if (hasOverlap) {
        errors.push("Session dates overlap with another session");
      }
    }
    
    // Update validation state
    const newErrors = { ...validationErrors };
    if (errors.length > 0) {
      newErrors[index] = errors;
    } else {
      delete newErrors[index];
    }
    setValidationErrors(newErrors);
  };

  const formatAge = (months: string) => {
    if (!months) return '';
    const m = parseInt(months);
    if (m < 12) return `${m}m`;
    const years = Math.floor(m / 12);
    const remainingMonths = m % 12;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}m`;
  };

  const calculateWeeks = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Label className="text-base font-medium">Camp Sessions</Label>
          <p className="text-sm text-gray-600">
            Add multiple sessions with different dates, pricing, and age groups
          </p>
        </div>
        <Button
          type="button"
          onClick={addSession}
          size="sm"
          className="flex items-center gap-2"
          data-testid="button-add-session"
        >
          <Plus className="h-4 w-4" />
          Add Session
        </Button>
      </div>

      {sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8 text-center">
            <div>
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No sessions yet</p>
              <p className="text-sm text-gray-400">Add your first camp session to get started</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <Card key={session.id || index} className={validationErrors[index] ? 'border-red-300' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Session {index + 1}
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSession(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  data-testid={`button-remove-session-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Session Name */}
              <div>
                <Label htmlFor={`session-${index}-name`}>Session Name *</Label>
                <Input
                  id={`session-${index}-name`}
                  value={session.name}
                  onChange={(e) => updateSession(index, 'name', e.target.value)}
                  placeholder="e.g., Summer Adventure Week 1"
                  data-testid={`input-session-${index}-name`}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`session-${index}-start`}>Start Date *</Label>
                  <Input
                    id={`session-${index}-start`}
                    type="date"
                    value={session.start_date}
                    onChange={(e) => updateSession(index, 'start_date', e.target.value)}
                    data-testid={`input-session-${index}-start-date`}
                  />
                </div>
                <div>
                  <Label htmlFor={`session-${index}-end`}>End Date *</Label>
                  <Input
                    id={`session-${index}-end`}
                    type="date"
                    value={session.end_date}
                    onChange={(e) => updateSession(index, 'end_date', e.target.value)}
                    data-testid={`input-session-${index}-end-date`}
                  />
                </div>
              </div>

              {/* Duration info */}
              {session.start_date && session.end_date && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  Duration: {calculateWeeks(session.start_date, session.end_date)} week{calculateWeeks(session.start_date, session.end_date) !== 1 ? 's' : ''}
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`session-${index}-price`}>Price *</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id={`session-${index}-price`}
                      type="number"
                      value={session.price_amount}
                      onChange={(e) => updateSession(index, 'price_amount', e.target.value)}
                      placeholder="350"
                      className="rounded-l-none"
                      data-testid={`input-session-${index}-price`}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`session-${index}-unit`}>Price Unit *</Label>
                  <Select
                    value={session.price_unit}
                    onValueChange={(value) => updateSession(index, 'price_unit', value)}
                  >
                    <SelectTrigger data-testid={`select-session-${index}-price-unit`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Per Day</SelectItem>
                      <SelectItem value="week">Per Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Age Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`session-${index}-min-age`}>Min Age (months)</Label>
                  <Input
                    id={`session-${index}-min-age`}
                    type="number"
                    value={session.min_age_months}
                    onChange={(e) => updateSession(index, 'min_age_months', e.target.value)}
                    placeholder="36"
                    min="0"
                    max="216"
                    data-testid={`input-session-${index}-min-age`}
                  />
                  {session.min_age_months && (
                    <p className="text-xs text-gray-500 mt-1">{formatAge(session.min_age_months)}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`session-${index}-max-age`}>Max Age (months)</Label>
                  <Input
                    id={`session-${index}-max-age`}
                    type="number"
                    value={session.max_age_months}
                    onChange={(e) => updateSession(index, 'max_age_months', e.target.value)}
                    placeholder="144"
                    min="0"
                    max="216"
                    data-testid={`input-session-${index}-max-age`}
                  />
                  {session.max_age_months && (
                    <p className="text-xs text-gray-500 mt-1">{formatAge(session.max_age_months)}</p>
                  )}
                </div>
              </div>

              {/* Capacity */}
              <div>
                <Label htmlFor={`session-${index}-capacity`}>Capacity *</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                    <Users className="h-4 w-4 text-gray-500" />
                  </div>
                  <Input
                    id={`session-${index}-capacity`}
                    type="number"
                    value={session.capacity}
                    onChange={(e) => updateSession(index, 'capacity', e.target.value)}
                    placeholder="20"
                    min="1"
                    className="rounded-l-none"
                    data-testid={`input-session-${index}-capacity`}
                  />
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors[index] && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-medium text-red-800 mb-1">Please fix the following:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {validationErrors[index].map((error, errorIndex) => (
                      <li key={errorIndex}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      {sessions.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700 font-medium mb-2">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} configured
          </p>
          <div className="space-y-1 text-xs text-green-600">
            {sessions.map((session, index) => (
              <div key={index}>
                {session.name || `Session ${index + 1}`}: 
                {session.start_date && session.end_date && 
                  ` ${new Date(session.start_date).toLocaleDateString()} - ${new Date(session.end_date).toLocaleDateString()}`
                }
                {session.price_amount && ` • $${session.price_amount}/${session.price_unit}`}
                {session.capacity && ` • ${session.capacity} spots`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}