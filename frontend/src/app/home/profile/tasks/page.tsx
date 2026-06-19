"use client";
import React, { useState } from "react";
import { useCustomerTasks, useAddCustomerTaskComment } from "@/hooks/useTasks";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, MessageSquare, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CustomerTasksPage = () => {
  const { data: response, isPending } = useCustomerTasks();
  const tasks = response?.tasks || [];
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const { mutate: addComment, isPending: isCommenting } = useAddCustomerTaskComment();

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedTask) return;
    addComment({ id: selectedTask._id, text: commentText }, {
      onSuccess: (data) => {
        setCommentText("");
        setSelectedTask(data.task); // Update the modal with the new comment
      }
    });
  };

  if (isPending) return <div className="p-8 text-center text-gray-500">Loading your tasks...</div>;

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>
      
      {tasks.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-500">You don't have any tasks right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task: any) => (
            <div 
              key={task._id} 
              onClick={() => setSelectedTask(task)}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col gap-3"
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-semibold">{task.title}</h3>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
              )}
              
              <div className="mt-auto pt-4 flex gap-4 text-xs text-gray-400 font-medium">
                {task.dueDate && (
                  <span className="flex items-center gap-1.5"><CalendarIcon size={14} /> {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                )}
                <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {task.comments?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
              {selectedTask?.description || "No description provided."}
            </div>
            
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Updates & Comments</h4>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                {selectedTask?.comments?.map((comment: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-200 text-xs text-gray-600">{comment.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-gray-50 rounded-xl rounded-tl-none p-3">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-bold text-gray-900">{comment.userName}</span>
                        <span className="text-[10px] text-gray-400">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  </div>
                ))}
                {(!selectedTask?.comments || selectedTask.comments.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Input 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Ask a question or reply..."
                  className="bg-gray-50 border-gray-200"
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment} disabled={isCommenting} size="icon" className="shrink-0 bg-black text-white hover:bg-gray-800 rounded-lg">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerTasksPage;
