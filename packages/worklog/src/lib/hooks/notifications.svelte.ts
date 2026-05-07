export type Notification = {
    kind: "error" | "info" | "info-square" | "success" | "warning" | "warning-alt";
    title: string;
    subtitle?: string;
    timeout?: number;
};

class NotificationState {
    queue: any = $state(null);

    add(notification: Notification) {
        if (this.queue) {
            this.queue.add(notification);
        } else {
            console.warn("Notification queue not initialized. Notification:", notification);
        }
    }
}

export const notifications = new NotificationState();
