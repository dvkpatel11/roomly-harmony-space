
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AnimatedLogo from '@/components/ui/AnimatedLogo';
import { 
  CheckCheck, 
  Users, 
  Calendar, 
  MessageSquare, 
  Bell, 
  BarChart, 
  Star, 
  Lock
} from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { 
    icon: CheckCheck, 
    title: "Task Management", 
    description: "Create, assign, and track household tasks with ease" 
  },
  { 
    icon: Users, 
    title: "Household Management", 
    description: "Organize members, roles, and responsibilities" 
  },
  { 
    icon: Calendar, 
    title: "Shared Calendar", 
    description: "Coordinate events and schedules in one place" 
  },
  { 
    icon: MessageSquare, 
    title: "Group Communication", 
    description: "Chat, announcements, and file sharing" 
  },
  { 
    icon: Bell, 
    title: "Smart Notifications", 
    description: "Stay informed with customizable alerts" 
  },
  { 
    icon: Star, 
    title: "Gamification", 
    description: "Earn badges and track task completion streaks" 
  },
  { 
    icon: BarChart, 
    title: "Contribution Insights", 
    description: "Visualize household participation with analytics" 
  },
  { 
    icon: Lock, 
    title: "Privacy Controls", 
    description: "Manage what's shared and with whom" 
  }
];

const Index: React.FC = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <AnimatedLogo size="md" />
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Sign up</Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-block mb-4 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Simplify household management
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Bring <span className="text-primary">harmony</span> to your shared living space
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Roomly helps you and your housemates organize tasks, share responsibilities, 
              and communicate effectively — all in one beautiful, intuitive app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" asChild>
                <Link to="/register">Get started for free</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8" asChild>
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-4">Everything you need for harmonious living</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Designed for roommates, families, and communal living spaces of all kinds
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="border border-border/40 bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Screenshots/Mock Section */}
        <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-12">
          <h2 className="text-3xl font-bold text-center mb-4">See Roomly in Action</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            An intuitive interface designed to make household management a breeze
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div className="bg-primary-900 p-3 text-white font-medium">Task Dashboard</div>
                <div className="p-6 space-y-4">
                  <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-36 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div className="bg-primary-900 p-3 text-white font-medium">Household Chat</div>
                <div className="p-6 space-y-4">
                  <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-36 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <div className="bg-primary-900 p-3 text-white font-medium">Shared Calendar</div>
                <div className="p-6 space-y-4">
                  <div className="h-48 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
                  <div className="h-12 bg-muted/50 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonials/Social Proof */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">What people are saying</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Roomly has completely transformed how we manage our apartment. No more 'who did what' arguments!",
                name: "Alex K.",
                role: "College Student"
              },
              {
                quote: "The task rotation feature is brilliant. Everyone in our house now contributes equally without any drama.",
                name: "Sarah M.",
                role: "Young Professional"
              },
              {
                quote: "As a busy parent, the shared calendar keeps our family organized and in sync. Best household app out there!",
                name: "Michael T.",
                role: "Family Household"
              }
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                className="bg-card border border-border/40 p-6 rounded-xl shadow-sm"
              >
                <div className="mb-4 text-primary">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} size={16} className="inline fill-primary" />
                  ))}
                </div>
                <p className="mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 my-12 bg-primary/5 rounded-3xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to bring harmony to your household?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of households already using Roomly to simplify their shared living experience.
            </p>
            <Button size="lg" className="px-8" asChild>
              <Link to="/register">Get started for free</Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border mt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <AnimatedLogo size="sm" />
                <span className="ml-4 text-muted-foreground">&copy; {new Date().getFullYear()} Roomly. All rights reserved.</span>
              </div>
              <div className="flex gap-6">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Index;
