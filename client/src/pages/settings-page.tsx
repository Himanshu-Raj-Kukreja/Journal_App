import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  Settings, User, Bell, Lock, Palette,
  Download, HardDrive, Shield, Upload, Home
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [autoSave, setAutoSave] = useState(localStorage.getItem('autoSave') !== 'false');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const { data: journals } = useQuery({
    queryKey: ["/api/journals"],
  });

  const exportJournals = () => {
    const journalData = JSON.stringify(journals, null, 2);
    const blob = new Blob([journalData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journals-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: "Your journals have been exported successfully",
    });
  };

  const importJournals = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const journals = JSON.parse(content);

      // TODO: Implement journal import API
      toast({
        title: "Import Successful",
        description: "Your journals have been imported successfully",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import journals. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  const handleThemeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('theme', enabled ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', enabled);
    toast({
      title: "Theme Updated",
      description: `Switched to ${enabled ? 'dark' : 'light'} mode`,
    });
  };

  const handleAutoSaveChange = (enabled: boolean) => {
    setAutoSave(enabled);
    localStorage.setItem('autoSave', enabled.toString());
    toast({
      title: "Auto-save Updated",
      description: `Auto-save ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotifications(enabled);
    if (enabled) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast({
            title: "Notifications Enabled",
            description: "You will now receive notifications",
          });
        }
      });
    }
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      setChangePasswordOpen(false);
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Change Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <Settings className="mr-2 h-8 w-8" />
          Settings
        </h1>
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/'}
          className="flex items-center"
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <p className="text-muted-foreground">{user?.username}</p>
              </div>
              <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Change Password</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    changePasswordMutation.mutate({
                      currentPassword: formData.get('currentPassword') as string,
                      newPassword: formData.get('newPassword') as string,
                    });
                  }} className="space-y-4">
                    <Input
                      type="password"
                      name="currentPassword"
                      placeholder="Current Password"
                      required
                    />
                    <Input
                      type="password"
                      name="newPassword"
                      placeholder="New Password"
                      required
                    />
                    <Button type="submit" className="w-full">Change Password</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={handleNotificationsChange}
              />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="mr-2 h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={handleThemeChange}
              />
              <Label htmlFor="darkMode">Dark mode</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              Storage & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoSave"
                checked={autoSave}
                onCheckedChange={handleAutoSaveChange}
              />
              <Label htmlFor="autoSave">Auto-save entries</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={exportJournals} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export Journals
              </Button>
              <label className="w-full">
                <Button variant="outline" className="w-full" onClick={() => document.getElementById('import-file')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Journals
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={importJournals}
                  className="hidden"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="encryption" defaultChecked />
              <Label htmlFor="encryption">End-to-end encryption</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="twoFactor" />
              <Label htmlFor="twoFactor">Two-factor authentication</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}