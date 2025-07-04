import React from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MapPin, BookOpen, Users, Calendar, BadgeIcon as IdCard, User as UserIcon, Camera, FilePlus, FileText, Download, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BaseProfile {
  name: string;
  email: string;
  id: string;
  phone?: string;
  join_date?: string;
  role: 'admin' | 'faculty' | 'student' | string;
}

interface AdminProfile extends BaseProfile {
  role: 'admin';
  department: string;
  office: string;
  permissions: string[];
  working_hours: string;
}

interface FacultyProfile extends BaseProfile {
  role: 'faculty';
  department: string;
  office: string;
  assigned_courses: string[];
  specialization: string;
  office_hours: string;
}

interface StudentProfile extends BaseProfile {
  role: 'student';
  student_id: string;
  program: string;
  year: string;
  section: string;
  gpa: string;
  advisor: string;
}

type ProfileData = AdminProfile | FacultyProfile | StudentProfile;

function buildProfileData(user: any): ProfileData | null {
  if (!user) return null;
  
  const baseData: Omit<BaseProfile, 'role'> = {
    name: user.name || 'Unknown User',
    email: user.email || '',
    id: user.id || '',
    phone: user.phone,
    join_date: user.join_date,
  };
  switch (user.role?.toLowerCase()) {
    case "admin":
      return {
        ...baseData,
        role: "admin" as const,
        department: "Administration",
        office: "Admin Building, Room 101",
        permissions: [
          "Full System Access",
          "User Management",
          "System Configuration",
        ],
        working_hours: "9:00 AM - 5:00 PM",
      };
    case "faculty":
      return {
        ...baseData,
        role: "faculty" as const,
        department: "Computer Science",
        office: "Engineering Building, Room 205",
        assigned_courses: [
          "CS101 - Intro to Programming",
          "CS201 - Data Structures",
          "CS301 - Algorithms",
        ],
        specialization: "Software Engineering",
        office_hours: "Mon-Wed-Fri: 2:00 PM - 4:00 PM",
      };
    case "student":
      return {
        ...baseData,
        role: "student" as const,
        student_id: "STU2024001",
        program: "Bachelor of Computer Science",
        year: "3rd Year",
        section: "Section A",
        gpa: "3.85",
        advisor: "Dr. John Smith",
      };
    default:
      return {
        ...baseData,
        role: "student" as const,
        student_id: "Unknown",
        program: "Unknown Program",
        year: "Unknown Year",
        section: "Unknown Section",
        gpa: "0.0",
        advisor: "Unknown Advisor",
      };
  }
}

function isAdminProfile(data: ProfileData): data is AdminProfile {
  return data?.role === "admin";
}
function isFacultyProfile(data: ProfileData): data is FacultyProfile {
  return data?.role === "faculty";
}
function isStudentProfile(data: ProfileData): data is StudentProfile {
  return data?.role === "student";
}

export function UserProfile() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const resumeInputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [resumeName, setResumeName] = React.useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = React.useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = React.useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const profile = React.useMemo(() => buildProfileData(user), [user]);

  // Load existing resume info on component mount
  React.useEffect(() => {
    if (user?.profileData?.resume_id) {
      setResumeName(user.profileData.resume_id);
      setResumeUrl(`/resumes/${user.profileData.resume_id}`);
    }
  }, [user]);

  const handleResumeUpload = async (file: File) => {
    if (!user) return;

    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const endpoint = user.role === 'faculty' ? '/api/faculty/upload-resume' : '/api/student/upload-resume';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResumeName(data.resumeId);
        setResumeUrl(data.resumeUrl);
        toast({
          title: "Success",
          description: "Resume uploaded successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!user) return;

    try {
      const endpoint = user.role === 'faculty' ? '/api/faculty/upload-resume' : '/api/student/upload-resume';
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
        },
      });

      if (response.ok) {
        setResumeName(null);
        setResumeUrl(null);
        toast({
          title: "Success",
          description: "Resume deleted successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Resume delete error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete resume",
        variant: "destructive",
      });
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-lg">No user data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <Card>
        <CardHeader className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
            <AvatarImage 
              src={previewImage || user?.image || undefined} 
              alt={user?.name || 'User avatar'} 
            />
            <AvatarFallback className="text-3xl font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
            {/* upload overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              title="Change avatar"
            >
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e)=>{
                const file = e.target.files?.[0];
                if(file){
                  const url = URL.createObjectURL(file);
                  setPreviewImage(url);
                  // TODO: send to backend
                }
              }}
            />
            </div>
          <div className="text-center">
            <CardTitle>{profile.name}</CardTitle>
            <CardDescription className="capitalize mt-1">{profile.role}</CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{profile.email}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{profile.phone}</span>
            </div>
          )}
          {/* Role specific information */}
          {isAdminProfile(profile) && (
            <>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.office}</span>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1 flex items-center gap-1"><UserIcon className="h-4 w-4 text-muted-foreground"/>Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((p: string) => (
                    <span key={p} className="text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {isFacultyProfile(profile) && (
            <>
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{profile.department}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.office}</span>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1 flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground"/>Assigned Courses</p>
                <div className="flex flex-wrap gap-2">
                  {profile.assigned_courses.map((c: string) => (
                    <span key={c} className="text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{profile.office_hours}</span>
              </div>
            </>
          )}

          {/* Resume upload section (common for faculty and students) */}
          {(user?.role === 'faculty' || user?.role === 'student') && (
            <>
              <Separator className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Resume</p>
                      {resumeName ? (
                        <p className="text-sm text-muted-foreground">
                          {resumeName.length > 50 ? `${resumeName.substring(0, 50)}...` : resumeName}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No resume uploaded</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {resumeUrl && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.open(resumeUrl, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" /> 
                        View
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={isUploadingResume}
                      onClick={() => resumeInputRef.current?.click()}
                      className="flex items-center gap-1"
                    >
                      <FilePlus className="h-3 w-3" /> 
                      {isUploadingResume ? 'Uploading...' : 'Upload'}
                    </Button>
                    
                    {resumeName && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleResumeDelete}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" /> 
                        Delete
                      </Button>
                    )}
                  </div>
                  
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleResumeUpload(file);
                      }
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {isStudentProfile(profile) && (
            <>
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{profile.program}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{profile.year} - {profile.section}</span>
              </div>
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>{profile.advisor}</span>
              </div>
              <div className="flex items-center gap-3">
                <IdCard className="h-4 w-4 text-muted-foreground" />
                <span>GPA: {profile.gpa}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
