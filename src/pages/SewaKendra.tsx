import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Clock, Zap, DollarSign, Users, Shield } from 'lucide-react';

const formSchema = z.object({
  district: z.string().min(1, "Please select a district"),
  taluka: z.string().min(1, "Please select a taluka"),
});

// Sample data for districts and talukas
const districts = [
  "Ahmednagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur",
  "Chhatrapati Sambhajinagar", "Dharashiv", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur",
  "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigarh", "Ratnagiri",
  "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
];

const talukas: Record<string, string[]> = {
  "Mumbai City": ["Colaba", "Fort", "Byculla", "Mazgaon", "Girgaon", "Tardeo"],
  "Pune": ["Pune City", "Haveli", "Maval", "Mulshi", "Velhe", "Bhor", "Purandar"],
  "Nashik": ["Nashik", "Dindori", "Baglan", "Kalwan", "Deola", "Sinnar"],
  // Add more talukas for other districts as needed
};

// Sample VLE data
const sampleVLEs = [
  {
    name: "Rajesh Kumar",
    address: "Shop No. 5, Main Market, Sector 12",
    pincode: "400001",
    mobile: "+91-9876543210",
    email: "rajesh.kumar@example.com"
  },
  {
    name: "Priya Sharma",
    address: "B-102, Commercial Complex, Near Bus Stand",
    pincode: "400002",
    mobile: "+91-9876543211",
    email: "priya.sharma@example.com"
  },
  {
    name: "Amit Patel",
    address: "Office No. 3, Government Building, Main Road",
    pincode: "400003",
    mobile: "+91-9876543212",
    email: "amit.patel@example.com"
  }
];

export default function SewaKendra() {
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [showResults, setShowResults] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      district: "",
      taluka: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    setShowResults(true);
  };

  const benefits = [
    { icon: Zap, title: "Quick Service", description: "Fast and efficient service delivery" },
    { icon: Users, title: "Service At Doorstep", description: "Convenient home-based services" },
    { icon: MapPin, title: "Easy Access", description: "Multiple locations for easy reach" },
    { icon: DollarSign, title: "Easy Payment", description: "Multiple payment options available" },
    { icon: Shield, title: "User Friendly", description: "Simple and intuitive interface" },
    { icon: Clock, title: "Save Time", description: "Reduced waiting time and paperwork" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="citizen" />

      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Sewa Kendra Locator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find the nearest Sewa Kendra (Service Center) in your area for easy access to government services
            </p>
          </div>

        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Know Your Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <benefit.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search Form */}
        <Card className="max-w-4xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="text-center">Find Sewa Kendra</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedDistrict(value);
                            form.setValue("taluka", ""); // Reset taluka when district changes
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="---Select---" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {districts.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taluka"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taluka *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!selectedDistrict}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="--Select--" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedDistrict && talukas[selectedDistrict]?.map((taluka) => (
                              <SelectItem key={taluka} value={taluka}>
                                {taluka}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-center">
                  <Button type="submit" className="px-8 py-2">
                    Proceed
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Results Table */}
        {showResults && (
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Available Sewa Kendras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>VLE Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Pincode</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Email ID</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleVLEs.map((vle, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{vle.name}</TableCell>
                        <TableCell>{vle.address}</TableCell>
                        <TableCell>{vle.pincode}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {vle.mobile}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {vle.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
