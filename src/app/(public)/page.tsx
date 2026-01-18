"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building2,
  Users,
  Stethoscope,
  FileText
} from "lucide-react";

/**
 * @title Aegis Health Medical Center - Homepage
 * @description Professional hospital website with patient intake portal
 */
export default function LandingPage() {
  const router = useRouter();

  const handleStartIntake = () => {
    router.push("/scheduling");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-black" />
              <div>
                <h1 className="text-xl font-semibold text-black">Aegis Health</h1>
                <p className="text-xs text-gray-600">Medical Center</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#services" className="text-sm text-gray-700 hover:text-black">Services</a>
              <a href="#departments" className="text-sm text-gray-700 hover:text-black">Departments</a>
              <a href="#contact" className="text-sm text-gray-700 hover:text-black">Contact</a>
              <Button 
                onClick={handleStartIntake}
                className="bg-black hover:bg-gray-800 text-white text-sm"
              >
                Patient Portal
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <h2 className="text-5xl font-bold text-black mb-6 leading-tight">
              Comprehensive Care,<br />
              Advanced Technology
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Aegis Health Medical Center provides exceptional healthcare services 
              with state-of-the-art facilities and a patient-centered approach.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={handleStartIntake}
                size="lg"
                className="bg-black hover:bg-gray-800 text-white"
              >
                Schedule Appointment
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-black text-black hover:bg-gray-50"
              >
                Emergency Care
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-16 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            <button
              onClick={handleStartIntake}
              className="bg-white border border-gray-200 p-6 hover:border-black transition-colors text-left"
            >
              <Calendar className="h-8 w-8 text-black mb-4" />
              <h3 className="font-semibold text-black mb-2">Book Appointment</h3>
              <p className="text-sm text-gray-600">Schedule your visit online</p>
            </button>
            
            <div className="bg-white border border-gray-200 p-6 hover:border-black transition-colors">
              <FileText className="h-8 w-8 text-black mb-4" />
              <h3 className="font-semibold text-black mb-2">Medical Records</h3>
              <p className="text-sm text-gray-600">Access your health information</p>
            </div>
            
            <div className="bg-white border border-gray-200 p-6 hover:border-black transition-colors">
              <Clock className="h-8 w-8 text-black mb-4" />
              <h3 className="font-semibold text-black mb-2">Visiting Hours</h3>
              <p className="text-sm text-gray-600">Daily 8:00 AM - 8:00 PM</p>
            </div>
            
            <div className="bg-white border border-gray-200 p-6 hover:border-black transition-colors">
              <Phone className="h-8 w-8 text-black mb-4" />
              <h3 className="font-semibold text-black mb-2">Emergency</h3>
              <p className="text-sm text-gray-600">24/7 Care: (555) 911-4911</p>
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-black mb-12">Our Departments</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-l-2 border-black pl-6">
              <h3 className="text-xl font-semibold text-black mb-3">Emergency Medicine</h3>
              <p className="text-gray-600 mb-4">
                24/7 emergency care with board-certified physicians and advanced life support.
              </p>
              <a href="#" className="text-sm text-black hover:underline">Learn more →</a>
            </div>
            
            <div className="border-l-2 border-black pl-6">
              <h3 className="text-xl font-semibold text-black mb-3">Internal Medicine</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive primary care and preventive medicine services for adults.
              </p>
              <a href="#" className="text-sm text-black hover:underline">Learn more →</a>
            </div>
            
            <div className="border-l-2 border-black pl-6">
              <h3 className="text-xl font-semibold text-black mb-3">Diagnostic Imaging</h3>
              <p className="text-gray-600 mb-4">
                State-of-the-art imaging technology including MRI, CT, and ultrasound.
              </p>
              <a href="#" className="text-sm text-black hover:underline">Learn more →</a>
            </div>
            
            <div className="border-l-2 border-black pl-6">
              <h3 className="text-xl font-semibold text-black mb-3">Cardiology</h3>
              <p className="text-gray-600 mb-4">
                Expert cardiac care with advanced diagnostic and treatment capabilities.
              </p>
              <a href="#" className="text-sm text-black hover:underline">Learn more →</a>
            </div>
            
            <div className="border-l-2 border-black pl-6">
              <h3 className="text-xl font-semibold text-black mb-3">Surgery</h3>
              <p className="text-gray-600 mb-4">
                General and specialized surgical procedures with experienced surgeons.
              </p>
              <a href="#" className="text-sm text-black hover:underline">Learn more →</a>
            </div>
            
            <div className="border-l-2 border-black pl-6">
              <h3 className="text-xl font-semibold text-black mb-3">Laboratory Services</h3>
              <p className="text-gray-600 mb-4">
                Full-service clinical laboratory with rapid turnaround times.
              </p>
              <a href="#" className="text-sm text-black hover:underline">Learn more →</a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="services" className="py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-black mb-6">
                Patient-Centered Excellence
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                At Aegis Health Medical Center, we combine clinical expertise with advanced 
                technology to deliver personalized, compassionate care. Our facility features 
                modern equipment and a team dedicated to your health and well-being.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mt-2" />
                  <div>
                    <p className="font-medium text-black">Board-Certified Physicians</p>
                    <p className="text-sm text-gray-600">Experienced specialists across all major disciplines</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mt-2" />
                  <div>
                    <p className="font-medium text-black">Advanced Diagnostics</p>
                    <p className="text-sm text-gray-600">Latest imaging and laboratory technology</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mt-2" />
                  <div>
                    <p className="font-medium text-black">Integrated Care</p>
                    <p className="text-sm text-gray-600">Coordinated treatment across specialties</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 h-96 flex items-center justify-center">
              <Stethoscope className="h-24 w-24 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold text-black mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-black mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-black">Address</p>
                    <p className="text-sm text-gray-600">123 Medical Center Drive<br />Healthcare City, HC 12345</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-black mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-black">Phone</p>
                    <p className="text-sm text-gray-600">Main: (555) 123-4567<br />Emergency: (555) 911-4911</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-black mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-black">Email</p>
                    <p className="text-sm text-gray-600">info@aegishealth.med</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-black mb-6">Patient Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">Insurance & Billing</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">Medical Records Request</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">Patient Rights</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">FAQs</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-black mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">Careers</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">Physician Directory</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">News & Events</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">Community Programs</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-black">Volunteer</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-black" />
              <span className="text-lg font-semibold text-black">Aegis Health Medical Center</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2026 Aegis Health. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}