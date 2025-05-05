import * as Api from "../../6814e0212e6854005053db58/.build/index.mjs";
import * as AccessManager from "../../6810bc722e6854005053ab0d/.build";
import * as Invitation from "../../68123c2b2e6854005053c596/.build";

export const name = "Resource";

export async function invite(req, res) {
	return AccessManager.check("resource:invite", async (req, res) => {
		return Invitation.invite(req, res);
	})(req, res);
}

export async function revoke(req, res) {
	return AccessManager.check("resource:revoke", async (req, res) => {
		return Invitation.revoke(req, res);
	})(req, res);
}

export async function deleteMember(req, res) {
	return AccessManager.check("resource:member:delete", async (req, res) => {
		const id = req.params.get("id");
		const memberId = req.params.get("memberId");

		const resource = await getResource(id);
		const members = resource.members || [];

		const filteredMembers = members.filter(member => member !== memberId)

		const Bucket = Api.useBucket();
		return Bucket.data.patch(Api.BUCKET.RESOURCE, id, { members: filteredMembers });
	})(req, res);
}

export function getResource(id) {
	const Bucket = Api.useBucket();
	return Bucket.data.get(Api.BUCKET.RESOURCE, id);
}

export function patchResource(id, data) {
	const Bucket = Api.useBucket();
	return Bucket.data.patch(Api.BUCKET.RESOURCE, id, data);
}