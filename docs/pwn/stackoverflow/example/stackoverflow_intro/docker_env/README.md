# Docker Environment

> A docker repository for deploying ctf problem

## Configuration

Put files to floder `bin`. They'll be copied to /home/ctf. **Update the flag** at the same time.

### Linux

Change BINNAME to your binary name which under `bin` directory.

```sh
ls ctf.xinetd docker-compose.yml | xargs sed -i 's/stack_example01/BINNAME/g'
```

### Mac OSX

```sh
ls ctf.xinetd docker-compose.yml | xargs sed -i '' 's/stack_example01/BINNAME/g'
```

### By mannual

Edit `ctf.xinetd` and `docker-compose.yml`. replace `./stack_example01` to your command.

You can also edit `Dockerfile, ctf.xinetd, start.sh` to custom your environment.

## Build and Run

    docker-compose up

or

    docker-compose up -d