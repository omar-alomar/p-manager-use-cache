import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

// --- Task schemas ---

export const taskSchema = z.object({
  title: z.string().min(1, "Required"),
  completed: z.boolean().default(false),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  userId: z.number({ error: "Required" }).int().positive(),
  projectId: z.number().int().positive().optional(),
})

/** Parse task fields from FormData */
export function parseTaskFormData(formData: FormData) {
  const projectIdRaw = formData.get("projectId")
  const projectId = projectIdRaw && Number(projectIdRaw) > 0 ? Number(projectIdRaw) : undefined

  return taskSchema.safeParse({
    title: formData.get("title"),
    completed: formData.get("completed") === "on",
    urgency: formData.get("urgency") || "MEDIUM",
    userId: Number(formData.get("userId")),
    projectId,
  })
}

// --- Project schemas ---

export const projectSchema = z.object({
  title: z.string().min(1, "Required"),
  clientId: z.number({ error: "Required" }).int().positive("Required"),
  body: z.string().min(1, "Required"),
  milestone: z.date().nullable(),
  mbaNumber: z.string().default(""),
  coFileNumbers: z.string().default(""),
  dldReviewer: z.string().default(""),
  userId: z.number({ error: "Required" }).int().positive(),
  milestones: z.array(z.object({
    date: z.date(),
    item: z.string(),
    apfo: z.boolean().default(false),
  })).default([]),
})

/** Parse project fields from FormData */
export function parseProjectFormData(formData: FormData) {
  const milestone = formData.get("milestone") as string

  // Parse milestone entries
  const milestones: { date: Date; item: string; apfo: boolean }[] = []
  let milestoneIndex = 0
  while (formData.get(`milestoneDate_${milestoneIndex}`)) {
    const date = formData.get(`milestoneDate_${milestoneIndex}`) as string
    const item = formData.get(`milestoneItem_${milestoneIndex}`) as string
    const apfo = formData.get(`milestoneApfo_${milestoneIndex}`) === "on"
    if (date) {
      milestones.push({ date: new Date(date), item: item || "", apfo })
    }
    milestoneIndex++
  }

  const clientIdRaw = formData.get("clientId") as string

  return projectSchema.safeParse({
    title: formData.get("title"),
    clientId: clientIdRaw ? Number(clientIdRaw) : undefined,
    body: formData.get("body"),
    milestone: milestone ? new Date(milestone) : null,
    mbaNumber: (formData.get("mbaNumber") as string) || "",
    coFileNumbers: (formData.get("coFileNumbers") as string) || "",
    dldReviewer: (formData.get("dldReviewer") as string) || "",
    userId: Number(formData.get("userId")),
    milestones,
  })
}

export const milestoneSchema = z.object({
  date: z.string().min(1, "Date is required"),
  item: z.string().min(1, "Milestone description is required").transform(s => s.trim()),
  apfo: z.boolean().default(false),
})