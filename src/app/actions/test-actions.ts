'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { localPrisma } from "@/app/lib/db/local-client";

export async function updateTestTemplatePrice(id: string, fees: number) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // Check for permission or SuperAdmin role
  // Using explicit check as type assertion might be needed if types aren't fully propagated in this file context
  if (!session.user.can_edit_fees && session.user.role !== 'SuperAdmin') {
    throw new Error("Permission denied");
  }

  try {
    const updatedTemplate = await localPrisma.testTemplate.update({
      where: { id },
      data: { fees },
    });

    return { success: true, data: updatedTemplate };
  } catch (error) {
    console.error("Failed to update test price:", error);
    return { success: false, error: "Failed to update price" };
  }
}
