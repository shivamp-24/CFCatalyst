import { Target, TrendingUp, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Target,
    title: "Smart Problem Selection",
    description:
      "Tailored problem sets based on your contest type, rating, and weak topics for focused practice.",
  },
  {
    icon: Trophy,
    title: "Contest Simulation",
    description:
      "Train with realistic Codeforces-style practice contests, complete with time limits and problem variety.",
  },
  {
    icon: TrendingUp,
    title: "Performance Tracking",
    description:
      "In-depth analytics to track your progress, including performance ratings and submission insights.",
  },
  {
    icon: Users,
    title: "Competitive Environment",
    description:
      "Challenge yourself with personalized practice contests and review your performance on detailed leaderboards.",
  },
];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="relative overflow-hidden rounded-full p-1 transition-all duration-300 group-hover:bg-gray-100 group-hover:shadow-md">
              <Trophy className="h-8 w-8 text-gray-600 transition-transform duration-300 group-hover:scale-110 group-hover:text-gray-700" />
            </div>
            <span className="text-2xl font-bold text-gray-900 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gray-600 after:transition-all after:duration-300 group-hover:after:w-full">
              CFCatalyst
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                variant="outline"
                className="bg-white border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Master Competitive Programming
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Boost your Codeforces skills with personalized practice contests,
              curated problems, and comprehensive performance analytics.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="text-lg px-8 py-3 bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200"
                >
                  Get Started
                </Button>
              </Link>

              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-3 bg-white border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose CFCatalyst?
              </h2>

              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our platform provides everything you need to excel in
                competitive programming
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow duration-300 border-gray-100"
                >
                  <CardHeader>
                    <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                      <feature.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-blue-600 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Elevate Your Codeforces Performance Today
            </h2>

            <p className="text-xl mb-8 opacity-90">
              Train with personalized practice contests, conquer your weak
              topics, and track your progress with CFCatalyst.
            </p>

            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-3 bg-white text-blue-700 hover:bg-blue-50 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200"
              >
                Start Your Journey Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} CFCatalyst. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-blue-600">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-600">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-600">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
