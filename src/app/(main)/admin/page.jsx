"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash } from "lucide-react";
import DoctorBonuses from "@/components/DoctorBonuses";

export default function AdminPage() {
  const supabase = createClient();
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);

  console.log(services);

  // Modal states
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    department: "",
  });
  const [newDoctor, setNewDoctor] = useState({
    full_name: "",
    bonus_percent: "",
    department_id: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const { data: deps } = await supabase.from("departments").select("*");
    const { data: servs } = await supabase
      .from("services")
      .select("*, departments(*)");
    const { data: docs } = await supabase.from("doctors").select("*");
    setDepartments(deps || []);
    setServices(servs || []);
    setDoctors(docs || []);
  }

  async function handleAddService() {
    const { error } = await supabase.from("services").insert([newService]);
    if (error) {
      console.error(error);
    }
    if (!error) {
      fetchAll();
      setNewService({ name: "", price: "", department: "" });
    }
  }

  async function handleAddDoctor() {
    const { error } = await supabase.from("doctors").insert([newDoctor]);
    if (!error) {
      fetchAll();
      setNewDoctor({ full_name: "", bonus_percent: "", department_id: "" });
    }
  }

  async function deleteService(id) {
    await supabase.from("services").delete().eq("id", id);
    fetchAll();
  }

  async function deleteDoctor(id) {
    await supabase.from("doctors").delete().eq("id", id);
    fetchAll();
  }

  return (
    <div className="p-4">
      <DoctorBonuses />
      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Xizmatlar</TabsTrigger>
          <TabsTrigger value="doctors">Shifokorlar</TabsTrigger>
        </TabsList>

        {/* SERVICES */}
        <TabsContent value="services">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Xizmatlar</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Yangi xizmat qo‘shish</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yangi xizmat qo‘shish</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Input
                    placeholder="Nomi"
                    value={newService.name}
                    onChange={(e) =>
                      setNewService({ ...newService, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Narxi"
                    type="number"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                  />
                  <Select
                    value={newService.department}
                    onValueChange={(val) =>
                      setNewService({ ...newService, department: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bo‘lim tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddService}>Saqlash</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xizmat nomi</TableHead>
                  <TableHead>Bo'lim</TableHead>
                  <TableHead>Narxi (so‘m)</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-medium">
                      {s.departments.name}
                    </TableCell>
                    <TableCell>{s.price.toLocaleString()} so‘m</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteService(s.id)}
                      >
                        <Trash />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* DOCTORS */}
        <TabsContent value="doctors">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Shifokorlar</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Yangi shifokor qo‘shish</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yangi shifokor qo‘shish</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Input
                    placeholder="Ism Familiyasi"
                    value={newDoctor.full_name}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, full_name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Bonus %"
                    type="number"
                    value={newDoctor.bonus_percent}
                    onChange={(e) =>
                      setNewDoctor({
                        ...newDoctor,
                        bonus_percent: e.target.value,
                      })
                    }
                  />
                  <Select
                    value={newDoctor.department_id}
                    onValueChange={(val) =>
                      setNewDoctor({ ...newDoctor, department_id: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bo‘lim tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddDoctor}>Saqlash</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To‘liq ism</TableHead>
                  <TableHead>Bonus (%)</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.full_name}</TableCell>
                    <TableCell>{d.bonus_percent}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        onClick={() => deleteDoctor(d.id)}
                      >
                        <Trash />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
