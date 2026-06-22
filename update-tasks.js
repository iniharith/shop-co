const fs = require('fs');
const path = 'backend/admin/src/components/global/tasks/tasksManager.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('Accordion')) {
    code = code.replace(
        'import { Dialog',
        'import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";\nimport { Dialog'
    );
}

const boardViewMatch = code.indexOf('{/* Board View */}');
const boardViewEnd = code.indexOf('{/* List View */}');

const newBoardView = \      {/* Board View */}
      {viewMode === "board" && (
        <div className="w-full pb-4">
          <Accordion type="multiple" defaultValue={['TODO', 'IN_PROGRESS', 'PENDING_ARTWORK']} className="flex flex-col gap-4">
            {columns.map(status => {
              const statusTasks = tasks.filter((t: any) => t.status === status);
              if (statusTasks.length === 0) return null; // Only show sections with tasks to keep it clean
              return (
                <AccordionItem key={status} value={status} className="bg-muted/30 rounded-xl border border-border/50 px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
                        {status.replace(/_/g, " ")}
                        <Badge variant="secondary" className="rounded-full bg-background border border-border/50 ml-2">
                          {statusTasks.length}
                        </Badge>
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {statusTasks.map((task: any) => (
                        <Card key={task._id} className="cursor-pointer hover:shadow-md transition-shadow group border border-border/50" onClick={() => setSelectedTask(task)}>
                          <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-medium text-sm leading-tight">{task.title}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(task._id, e)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                              {task.comments?.length > 0 && (
                                <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                                  <MessageSquare className="w-3 h-3" /> {task.comments.length}
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                              <Input 
                                type="date" 
                                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""} 
                                onChange={e => updateTask({ id: task._id, data: { dueDate: e.target.value ? new Date(e.target.value) : null } })}
                                className="h-7 text-[10px] bg-muted/50 border-0 focus:ring-0 w-full px-2"
                              />
                              <Select value={task.assignee || "unassigned"} onValueChange={(v) => updateTask({ id: task._id, data: { assignee: v === "unassigned" ? null : v } })}>
                                <SelectTrigger className="h-7 text-xs font-bold bg-muted/50 border-0 focus:ring-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {usersData?.users?.filter((u: any) => ['admin', 'sysadmin', 'boss'].includes(u.role)).map((admin: any) => (
                                    <SelectItem key={admin._id} value={admin._id} className="font-bold">{admin.name || admin.email}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Select value={task.status} onValueChange={(v) => handleStatusChange(task._id, v)}>
                              <SelectTrigger className="h-7 text-xs bg-muted/50 border-0 focus:ring-0" onClick={e => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map(s => (
                                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}

\n\n      \
      
const oldContent = code.substring(0, boardViewMatch) + newBoardView + code.substring(boardViewEnd);
fs.writeFileSync(path, oldContent);
console.log('Done!');
