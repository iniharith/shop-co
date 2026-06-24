"use client";

import React, { useEffect, useState } from "react";
import AxiosInstance from "@/utils/axios";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, Image as ImageIcon, Download, FileText, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function PublicFolderView({ params }: { params: { folderId: string } }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const decodedFolderId = decodeURIComponent(params.folderId);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await AxiosInstance("").get(`/api/files/folder/${params.folderId}`);
        if (response.data?.success) {
          setFiles(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch folder files:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [params.folderId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleDownloadAll = () => {
    files.forEach(file => {
      window.open(file.path, "_blank");
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Folder className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{decodedFolderId}</h1>
              <p className="text-sm text-muted-foreground">{files.length} Files Available</p>
            </div>
          </div>
          <Button onClick={handleDownloadAll} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" /> Download All
          </Button>
        </div>

        {files.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-white border border-dashed rounded-xl shadow-sm">
            This folder is empty or does not exist.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {files.map((file) => {
              const isImage = file.mimetype?.startsWith("image/");
              return (
                <Card key={file._id} className="overflow-hidden bg-white shadow-sm hover:shadow-md transition-all border">
                  {isImage ? (
                    <div className="h-48 relative bg-muted group overflow-hidden">
                      <img src={file.path} alt={file.originalName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button variant="secondary" size="sm" onClick={() => window.open(file.path, "_blank")}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-muted flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="w-16 h-16 mb-4 opacity-50" />
                      <span className="text-sm">Document File</span>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm truncate" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          User: {file.userId}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(file.uploadedAt), "dd MMM yyyy, HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(file.path, "_blank")}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
