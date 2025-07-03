import React from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, MapPin, BookOpen, Users, Calendar, BadgeIcon as IdCard, User as UserIcon, Camera, FilePlus, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
      return null;
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
  const { user } = useAuth();
  const profile = React.useMemo(() => buildProfileData(user), [user]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-lg">No user data available.</p>
      </div>
    );
  }

  return (
<div className="p-8 max-w-4xl mx-auto w-full">
  <Card className="bg-gradient-to-br from-white via-gray-50 to-blue-50 shadow-xl border-0 rounded-3xl overflow-hidden">
    <CardHeader className="flex flex-col items-center gap-4 pb-0">
      <div className="relative">
        <Avatar className="h-28 w-28 ring-4 ring-blue-200 shadow-lg rounded-full">
          <AvatarImage 
            src={previewImage || user?.image || undefined} 
            alt={user?.name || 'User avatar'} 
          />
          <AvatarFallback className="text-4xl font-bold bg-blue-100 text-blue-700">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        {/* upload overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-2 right-2 bg-white border border-blue-100 rounded-full p-2 shadow-md hover:bg-blue-50 transition"
          title="Change avatar"
        >
          <Camera className="h-5 w-5 text-blue-600" />
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
      <div className="text-center mt-2">
        <CardTitle className="text-2xl font-bold text-blue-800">{profile.name}</CardTitle>
        <CardDescription className="capitalize mt-1 text-blue-500 font-medium tracking-wide">{profile.role}</CardDescription>
      </div>
    </CardHeader>
    <Separator className="my-4" />
    <CardContent className="grid md:grid-cols-2 gap-x-12 gap-y-8 text-base pb-8">

      <div className="flex items-center gap-3">
        <Mail className="h-5 w-5 text-blue-400" />
        <a href={`mailto:${profile.email}`} className="hover:underline text-blue-700 font-medium">{profile.email}</a>
      </div>
      {profile.phone && (
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-blue-400" />
          <a href={`tel:${profile.phone}`} className="hover:underline text-blue-700 font-medium">{profile.phone}</a>
        </div>
      )}

      {/* Role specific information */}
      {isAdminProfile(profile) && (
        <>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-700">{profile.office}</span>
          </div>
          <div>
            <p className="text-base font-semibold mb-2 flex items-center gap-2 text-blue-700">
              <UserIcon className="h-5 w-5 text-blue-400"/>Permissions
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.permissions.map((p: string) => (
                <span key={p} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-semibold">
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
            <BookOpen className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-700">{profile.department}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-700">{profile.office}</span>
          </div>
          <div>
            <p className="text-base font-semibold mb-2 flex items-center gap-2 text-blue-700">
              <Users className="h-5 w-5 text-blue-400"/>Assigned Courses
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.assigned_courses.map((c: string) => (
                <span key={c} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md font-semibold">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-700">{profile.office_hours}</span>
          </div>
        </>
      )}

      {/* Resume upload section (common) */}
      <div className="flex items-center gap-4 col-span-full mt-2 bg-blue-50 rounded-xl px-6 py-4 shadow-inner">
        <FileText className="h-5 w-5 text-blue-400" />
        {resumeName ? (
          <a href="#" className="text-blue-700 underline font-medium" download>{resumeName}</a>
        ) : (
          <span className="text-gray-500">No resume uploaded</span>
        )}
        <Button 
          size="sm" 
          className="ml-auto flex items-center gap-2 bg-black hover:bg-blue-700 text-white font-semibold rounded-lg shadow"
          onClick={() => resumeInputRef.current?.click()}
        >
          <FilePlus className="h-4 w-4" /> Upload
        </Button>
        <input
          ref={resumeInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e)=>{
            const file = e.target.files?.[0];
            if(file){
              setResumeName(file.name);
              // TODO: send to backend
            }
          }}
        />
      </div>

      {isStudentProfile(profile) && (
        <>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-700">{profile.program}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-700">{profile.year} - {profile.section}</span>
          </div>
          <div className="flex items-center gap-3">
            <UserIcon className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-700">{profile.advisor}</span>
          </div>
          <div className="flex items-center gap-3">
            <IdCard className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-gray-700">GPA: {profile.gpa}</span>
          </div>
        </>
      )}
    </CardContent>
  </Card>
</div>
  );
}
