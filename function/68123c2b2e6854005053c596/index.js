import * as Api from "../../6814e0212e6854005053db58/.build/index.mjs";
import * as Organization from "../../6810bd002e6854005053ab25/.build/index.mjs";
import * as Team from "../../68122cb52e6854005053c2e9/.build/index.mjs";
import * as Resource from "../../68186b042e6854005053e593/.build/index.mjs";

import { v4 as uuidv4 } from 'uuid';

const EXPIRATION_HOURS = 48;

export async function invite(req, res) {
	const id = req.params.get("id");
	const { user, role } = req.body;
	const { attributes } = await Api.decodeToken(req);

	const now = new Date();
	const expiresAt = now.setDate(now.getHours() + EXPIRATION_HOURS);

	const roleData = await getRoleById(role, res);
	if (!roleData) return;

	const insertData = {
		token: uuidv4(),
		user,
		role,
		[roleData.scope]: id,
		invited_by: attributes?.user,
		expires_at: new Date(expiresAt),
	}

	const Bucket = Api.useBucket();
	return Bucket.data.insert(Api.BUCKET.INVITATION, insertData);
}

export async function revoke(req, res) {
	const invitationId = req.params.get("invitationId");
	const { attributes } = await Api.decodeToken(req);

	const invitation = await getInvitation(invitationId);
	if (!invitation) return;

	if (invitation.invited_by !== attributes?.user) {
		return res.status(403).send({ message: "Forbidden" });
	}

	const Bucket = Api.useBucket();
	return Bucket.data.patch(Api.BUCKET.INVITATION, invitationId, { status: "revoked" });
}

export async function accept(req, res) {
	const { identifier, token } = req.body;
	if (!identifier || !token) {
		return res.status(400).send({ message: "Missing parameters" });
	}

	const Bucket = Api.useBucket();
	const [invitation] = await Bucket.data.getAll(Api.BUCKET.INVITATION, {
		queryParams: {
			filter: { identifier, token, status: "pending" }
		}
	});

	if (!invitation) {
		return res.status(400).send({ message: "Invitation not found or already handled" });
	}

	await Promise.all([
		handleMembership(invitation.organization, Organization, invitation.user),
		handleMembership(invitation.team, Team, invitation.user),
		handleMembership(invitation.resource, Resource, invitation.user)
	]);

	try {
		await Bucket.data.patch(Api.BUCKET.INVITATION, invitation._id, {
			status: "accepted", accepted_at: new Date()
		})
		return res.status(200).send({ message: "Invitation accepted" });
	} catch (err) {
		console.error("Error accepting invitation:", err);
		return res.status(400).send({ message: "Error processing request" });
	}
}

async function handleMembership(id, service, userId) {
	console.log(service.name)
	if (!id) return;
	const entity = await service[`get${service.name}`]?.(id);
	if (!entity) throw new Error(`Invalid ${service.name} ID`);

	const members = entity.members || [];
	members.push(userId);
	await service[`patch${service.name}`]?.(entity._id, { members });
}

async function getInvitation(id, res) {
	try {
		const Bucket = Api.useBucket();
		return await Bucket.data.get(Api.BUCKET.INVITATION, id);
	} catch (err) {
		res.status(422).send({
			error: "InvalidInvitation",
			message: "The specified invitation id is invalid."
		})
		return;
	}
}

async function getRoleById(id, res) {
	try {
		const Bucket = Api.useBucket();
		return await Bucket.data.get(Api.BUCKET.ROLE, id);
	} catch (err) {
		res.status(422).send({
			error: "InvalidRole",
			message: "The specified role is invalid."
		})
		return;
	}
}