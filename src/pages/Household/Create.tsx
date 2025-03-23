import { CreateHouseholdForm } from "@/components/household/CreateHouseholdForm";
import PageTransition from "@/components/layout/PageTransition";
import AnimatedLogo from "@/components/ui/AnimatedLogo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import { Link } from "react-router-dom";

const CreateHouseholdPage: React.FC = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="absolute top-6 left-6">
          <Link to="/">
            <AnimatedLogo size="md" />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="create">Create New</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <CreateHouseholdForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default CreateHouseholdPage;
