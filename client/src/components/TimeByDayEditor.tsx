import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

interface TimeByDayData {
  [key: string]: {
    start_time?: string;
    end_time?: string;
  };
}

interface TimeByDayEditorProps {
  label: string;
  selectedDays: string[];
  timeData: TimeByDayData;
  onDaysChange: (days: string[]) => void;
  onTimeChange: (timeData: TimeByDayData) => void;
  className?: string;
}

const WEEKDAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
];

export function TimeByDayEditor({
  label,
  selectedDays = [],
  timeData = {},
  onDaysChange,
  onTimeChange,
  className
}: TimeByDayEditorProps) {
  
  const handleDayToggle = (dayId: string, checked: boolean) => {
    let newSelectedDays: string[];
    let newTimeData = { ...timeData };
    
    if (checked) {
      newSelectedDays = [...selectedDays, dayId];
      // Initialize with default times if not present
      if (!newTimeData[dayId]) {
        newTimeData[dayId] = {
          start_time: '15:00', // 3 PM default for after-school
          end_time: '18:00'    // 6 PM default
        };
      }
    } else {
      newSelectedDays = selectedDays.filter(day => day !== dayId);
      // Remove time data for unchecked day
      delete newTimeData[dayId];
    }
    
    onDaysChange(newSelectedDays);
    onTimeChange(newTimeData);
  };

  const handleTimeChange = (dayId: string, field: 'start_time' | 'end_time', value: string) => {
    const newTimeData = {
      ...timeData,
      [dayId]: {
        ...timeData[dayId],
        [field]: value
      }
    };
    onTimeChange(newTimeData);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className={className}>
      <Label className="text-base font-medium">{label}</Label>
      <p className="text-sm text-gray-600 mb-4">
        Select operating days and set hours for each day
      </p>

      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          const dayTime = timeData[day.id];
          
          return (
            <Card key={day.id} className={`${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleDayToggle(day.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`day-${day.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Label htmlFor={`${day.id}-start`} className="text-sm text-gray-600">
                          Start:
                        </Label>
                        <Input
                          id={`${day.id}-start`}
                          type="time"
                          value={dayTime?.start_time || ''}
                          onChange={(e) => handleTimeChange(day.id, 'start_time', e.target.value)}
                          className="w-24"
                          data-testid={`input-${day.id}-start-time`}
                        />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor={`${day.id}-end`} className="text-sm text-gray-600">
                          End:
                        </Label>
                        <Input
                          id={`${day.id}-end`}
                          type="time"
                          value={dayTime?.end_time || ''}
                          onChange={(e) => handleTimeChange(day.id, 'end_time', e.target.value)}
                          className="w-24"
                          data-testid={`input-${day.id}-end-time`}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Time display for selected days */}
                {isSelected && dayTime?.start_time && dayTime?.end_time && (
                  <div className="mt-2 text-sm text-blue-700">
                    Operating hours: {formatTime(dayTime.start_time)} - {formatTime(dayTime.end_time)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {selectedDays.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            <span className="font-medium">Operating {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} per week</span>
          </p>
          <div className="mt-1 text-xs text-green-600">
            {selectedDays.map(day => {
              const dayLabel = WEEKDAYS.find(d => d.id === day)?.label;
              const dayTime = timeData[day];
              if (dayTime?.start_time && dayTime?.end_time) {
                return `${dayLabel}: ${formatTime(dayTime.start_time)}-${formatTime(dayTime.end_time)}`;
              }
              return dayLabel;
            }).join(' • ')}
          </div>
        </div>
      )}
    </div>
  );
}