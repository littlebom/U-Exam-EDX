import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import {
  listNotifications,
  markAllAsRead,
  deleteNotifications,
  deleteAllNotifications,
} from "@/services/notification.service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const rawPage = parseInt(url.searchParams.get("page") ?? "1", 10);
    const rawPerPage = parseInt(url.searchParams.get("perPage") ?? "20", 10);
    const result = await listNotifications(session.user.id, {
      page: Math.max(1, isNaN(rawPage) ? 1 : rawPage),
      perPage: Math.min(100, Math.max(1, isNaN(rawPerPage) ? 20 : rawPerPage)),
      unreadOnly: url.searchParams.get("unreadOnly") === "true",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    await markAllAsRead(session.user.id);
    return NextResponse.json({ success: true, data: { marked: true } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      );
    }

    const body = await req.json();

    let deleted: number;
    if (body.all === true) {
      deleted = await deleteAllNotifications(session.user.id);
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      deleted = await deleteNotifications(session.user.id, body.ids);
    } else {
      return NextResponse.json(
        { success: false, error: { message: "กรุณาระบุ ids หรือ all: true" } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: { deleted } });
  } catch (error) {
    return handleApiError(error);
  }
}
