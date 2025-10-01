"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Brain,
  Smartphone,
  Users,
  MessageCircle,
  Heart,
  Eye,
  Accessibility,
  Globe,
  Github,
} from "lucide-react";

export default function AboutPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: t("about.features.realTime"),
      key: "realTime",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: t("about.features.aiPowered"),
      key: "aiPowered",
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: t("about.features.multiPlatform"),
      key: "multiPlatform",
    },
    {
      icon: <Accessibility className="w-6 h-6" />,
      title: t("about.features.accessibility"),
      key: "accessibility",
    },
    {
      icon: <Github className="w-6 h-6" />,
      title: t("about.features.openSource"),
      key: "openSource",
    },
  ];

  const contributeActions = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: t("about.contribute.feedback"),
      href: "#feedback",
      color:
        "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: t("about.contribute.donate"),
      href: "#donate",
      color:
        "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            data-sign-text="About SignGPT"
          >
            {t("about.title")}
          </h1>
          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            data-sign-text="Learn more about SignGPT"
          >
            {t("about.description")}
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12">
          <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
            <div className="flex items-center mb-4">
              <Eye className="w-8 h-8 text-primary mr-3" />
              <h2
                className="text-2xl font-semibold text-foreground"
                data-sign-text="Our Mission"
              >
                {t("about.mission.title")}
              </h2>
            </div>
            <p
              className="text-muted-foreground leading-relaxed text-lg"
              data-sign-text="Mission statement"
            >
              {t("about.mission.content")}
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-12">
          <h2
            className="text-3xl font-semibold text-foreground mb-8 text-center"
            data-sign-text="Key Features"
          >
            {t("about.features.title")}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <div className="text-primary mr-3">{feature.icon}</div>
                  <h3
                    className="font-medium text-foreground"
                    data-sign-text={feature.key}
                  >
                    {feature.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technology Section */}
        <section className="mb-12">
          <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
            <div className="flex items-center mb-4">
              <Brain className="w-8 h-8 text-primary mr-3" />
              <h2
                className="text-2xl font-semibold text-foreground"
                data-sign-text="Technology"
              >
                {t("about.technology.title")}
              </h2>
            </div>
            <p
              className="text-muted-foreground leading-relaxed text-lg"
              data-sign-text="Technology description"
            >
              {t("about.technology.content")}
            </p>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-12">
          <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-primary mr-3" />
              <h2
                className="text-2xl font-semibold text-foreground"
                data-sign-text="Team"
              >
                {t("about.team.title")}
              </h2>
            </div>
            <p
              className="text-muted-foreground leading-relaxed text-lg"
              data-sign-text="Team description"
            >
              {t("about.team.content")}
            </p>
          </div>
        </section>

        {/* Supported Languages Section */}
        <section className="mb-12">
          <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
            <div className="flex items-center mb-4">
              <Globe className="w-8 h-8 text-primary mr-3" />
              <h2
                className="text-2xl font-semibold text-foreground"
                data-sign-text="Supported Languages"
              >
                {t("about.support.title")}
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span
                  className="text-foreground font-medium"
                  data-sign-text="American Sign Language"
                >
                  {t("about.support.asl")}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span
                  className="text-muted-foreground"
                  data-sign-text="More languages coming soon"
                >
                  {t("about.support.more")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Get Involved Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-semibold text-foreground mb-4"
              data-sign-text="Get Involved"
            >
              {t("about.contribute.title")}
            </h2>
            <p
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
              data-sign-text="Contribute to SignGPT"
            >
              {t("about.contribute.content")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {contributeActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  action.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className={`${action.color} rounded-lg p-6 text-center transition-colors block`}
                data-sign-text={index === 0 ? "Feedback" : "Donate"}
              >
                <div className="flex items-center justify-center mb-3">
                  {action.icon}
                </div>
                <h3 className="font-medium">{action.title}</h3>
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <p
            className="text-muted-foreground"
            data-sign-text="SignGPT - Making communication accessible"
          >
            SignGPT - Making communication accessible to everyone
          </p>
        </div>
      </div>
    </div>
  );
}
