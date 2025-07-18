import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Unlock } from "lucide-react";

interface VestingTimelineProps {
  data: {
    name: string;
    color: string;
    vestingSchedule: {
      tgeUnlock: number;
      vestingPeriod: number;
      cliffPeriod: number;
      description: string;
    };
  }[];
}

export default function VestingTimeline({ data }: VestingTimelineProps) {
  const maxVestingPeriod = Math.max(...data.map(item => item.vestingSchedule.vestingPeriod));
  
  return (
    <Card className="glass-card border-border">
      <CardContent className="p-6">
        <h4 className="text-lg font-bold mb-6 flex items-center">
          <Calendar className="h-5 w-5 text-primary mr-2" />
          Vesting Timeline Overview
        </h4>
        
        <div className="space-y-6">
          {data.map((item, index) => {
            const progressWidth = item.vestingSchedule.vestingPeriod > 0 
              ? (item.vestingSchedule.vestingPeriod / maxVestingPeriod) * 100 
              : 100;
            
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.vestingSchedule.tgeUnlock > 0 && (
                      <Badge variant="outline" className="text-xs flex items-center">
                        <Unlock className="h-3 w-3 mr-1" />
                        {item.vestingSchedule.tgeUnlock}% TGE
                      </Badge>
                    )}
                    {item.vestingSchedule.cliffPeriod > 0 && (
                      <Badge variant="secondary" className="text-xs flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.vestingSchedule.cliffPeriod}m cliff
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <Progress 
                    value={progressWidth} 
                    className="h-2"
                    style={{ 
                      backgroundColor: 'hsl(220, 20%, 20%)',
                    }}
                  />
                  <div 
                    className="absolute top-0 left-0 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: item.color,
                      width: `${progressWidth}%`
                    }}
                  />
                  
                  {/* TGE Unlock Indicator */}
                  {item.vestingSchedule.tgeUnlock > 0 && (
                    <div 
                      className="absolute -top-1 w-1 h-4 bg-white rounded-full shadow-md"
                      style={{ left: '0%' }}
                    />
                  )}
                  
                  {/* Cliff End Indicator */}
                  {item.vestingSchedule.cliffPeriod > 0 && item.vestingSchedule.vestingPeriod > 0 && (
                    <div 
                      className="absolute -top-1 w-1 h-4 bg-yellow-400 rounded-full shadow-md"
                      style={{ 
                        left: `${(item.vestingSchedule.cliffPeriod / item.vestingSchedule.vestingPeriod) * 100}%` 
                      }}
                    />
                  )}
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>TGE</span>
                  {item.vestingSchedule.vestingPeriod > 0 ? (
                    <span>{item.vestingSchedule.vestingPeriod} months</span>
                  ) : (
                    <span>Fully unlocked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <div className="w-1 h-4 bg-white rounded-full mr-2" />
              <span>TGE Unlock</span>
            </div>
            <div className="flex items-center">
              <div className="w-1 h-4 bg-yellow-400 rounded-full mr-2" />
              <span>Cliff End</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}