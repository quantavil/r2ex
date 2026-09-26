interface BucketItem {
	name: string;
}

class AppState {
	currentBucket = $state<string>("");
	buckets = $state<BucketItem[]>([{ name: "default" }]);
	currentPath = $state<string>("");
	searchQuery = $state<string>("");
	viewMode = $state<"grid" | "table">("table");
	apiReadonly = $state<boolean>(false);
	sidebarOpen = $state<boolean>(true);
	mobileMenuOpen = $state<boolean>(false);
	activeNav = $state<"files" | "shares" | "storage">("files");

	setBucket(bucket: string) {
		this.currentBucket = bucket;
		this.currentPath = "";
	}

	setPath(path: string) {
		this.currentPath = path;
	}

	toggleViewMode() {
		this.viewMode = this.viewMode === "grid" ? "table" : "grid";
	}

	toggleSidebar() {
		this.sidebarOpen = !this.sidebarOpen;
	}

	toggleMobileMenu() {
		this.mobileMenuOpen = !this.mobileMenuOpen;
	}

	setMobileMenu(open: boolean) {
		this.mobileMenuOpen = open;
	}

	setActiveNav(nav: "files" | "shares" | "storage") {
		this.activeNav = nav;
	}

	reset() {
		this.currentBucket = "";
		this.buckets = [{ name: "default" }];
		this.currentPath = "";
		this.searchQuery = "";
		this.viewMode = "table";
		this.apiReadonly = false;
		this.sidebarOpen = true;
		this.mobileMenuOpen = false;
		this.activeNav = "files";
	}
}

export const appState = new AppState();
